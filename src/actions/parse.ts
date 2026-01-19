import Ajv from "ajv";
import fs from "fs/promises";
import yaml from "js-yaml";
import convert from "json-schema-to-zod";
import type { SourceFile } from "ts-morph";
import { Project, VariableDeclarationKind } from "ts-morph";
import { z } from "zod";
import { snakeToPascal } from "../utils/string.js";

// TODO support oneOf correctly

// Tag enum definitions - must be defined before schemas for validation
const actionTagValues = [
  "read", // this action is read-only in the source system
  "write", // this action executes writes in the source system
] as const;

const parameterTagValues = [
  "recommend-predefined", // we recommend that this parameter is predefined by the user versus AI generated at runtime
] as const;

const jsonObjectSchema = z.object({
  type: z.string(),
  required: z.array(z.string()).optional(),
  properties: z.record(z.string(), z.any()).optional(), // Permissive for now, validate using JSON schema later
});

type JsonObjectSchema = z.infer<typeof jsonObjectSchema>;

const parameterTagEnum = z.enum([...parameterTagValues]);
const actionTagEnum = z.enum([...actionTagValues]);
const actionSchema = z.object({
  displayName: z.string(),
  description: z.string(),
  scopes: z.array(z.string()),
  tags: z.array(actionTagEnum).optional().default([]),
  parameters: jsonObjectSchema.optional(),
  output: jsonObjectSchema.optional(),
});

type ActionType = z.infer<typeof actionSchema>;

const actionTemplateSchema = actionSchema.extend({
  name: z.string(),
  provider: z.string(),
});

export type ActionTemplate = z.infer<typeof actionTemplateSchema>;

const providerSchema = z.record(z.string(), actionSchema);

const configSchema = z.object({
  actions: z.record(z.string(), providerSchema),
});

const authParamsSchemaStr = `
z.object({
    authToken: z.string().optional(),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    username: z.string().optional(),
    userAgent: z.string().optional(),
    emailFrom: z.string().optional(),
    emailReplyTo: z.string().optional(),
    emailBcc: z.string().optional(),
    cloudId: z.string().optional(),
    subdomain: z.string().optional(),
    password: z.string().optional(),
    awsAccessKeyId: z.string().optional(),
    awsSecretAccessKey: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    tenantId: z.string().optional(),
    refreshToken: z.string().optional(),
    redirectUri: z.string().optional(),
    userEmail: z.string().optional(),
})
`;

async function validateObject(object: JsonObjectSchema) {
  const ajv = new Ajv({
    strict: true,
    strictTypes: true,
    strictTuples: true,
    strictRequired: true,
  });

  // Add custom keyword - just allow it, we'll validate manually
  ajv.addKeyword("tags");

  // validate schema and check required fields
  const validParameters = ajv.validateSchema(object);
  if (!validParameters) {
    throw new Error(`Error validating object: ${JSON.stringify(ajv.errors, null, 4)}`);
  }

  // Handle oneOf schemas
  if (object.required && object.properties) {
    // Handle regular object schemas - check required fields
    for (const field of object.required) {
      if (!object.properties[field]) {
        throw new Error(`Required field ${field} is missing`);
      }
    }
  }

  // Validate tags in property schemas using Zod
  if (object.properties) {
    for (const [propName, propSchema] of Object.entries(object.properties)) {
      if (propSchema && typeof propSchema === "object" && "tags" in propSchema) {
        const tags = propSchema.tags;
        if (tags !== undefined) {
          const result = z.array(parameterTagEnum).safeParse(tags);
          if (!result.success) {
            throw new Error(
              `Property "${propName}" has invalid tags: ${result.error.errors.map(e => e.message).join(", ")}`,
            );
          }
        }
      }
    }
  }
}

async function addActionTypes({ file, prefix, action }: { file: SourceFile; prefix: string; action: ActionType }) {
  // add parameter types
  const paramsName = `${prefix}Params`;
  await addTypesToFile({
    file,
    obj: action.parameters,
    fallback: "z.object({})",
    name: paramsName,
  });
  // add output types
  const outputName = `${prefix}Output`;
  await addTypesToFile({
    file,
    obj: action.output,
    fallback: "z.void()",
    name: outputName,
  });
  // add function type
  const functionName = `${prefix}Function`;
  file.addTypeAlias({
    name: functionName,
    type: `ActionFunction<${paramsName}Type, AuthParamsType, ${outputName}Type>`,
    isExported: true,
  });
}

async function addTypesToFile({
  file,
  obj,
  fallback,
  name,
}: {
  file: SourceFile;
  obj?: JsonObjectSchema;
  fallback: string;
  name: string;
}) {
  // Tool calling framework currently having trouble filling in records as opposed to objects
  const zodSchema = obj ? convert(obj).replace(/z\.record\(z\.any\(\)\)/g, "z.object({}).catchall(z.any())") : fallback;
  const zodName = `${name}Schema`;
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: zodName,
        initializer: zodSchema,
      },
    ],
  });
  file.addTypeAlias({
    name: `${name}Type`,
    type: `z.infer<typeof ${zodName}>`,
    isExported: true,
  });
}

async function generateTypes({
  inputPath = "src/actions/schema.yaml",
  outputPath = "src/actions/autogen/templates.ts",
  templatesOutputPath = "src/actions/autogen/types.ts",
}: {
  inputPath?: string;
  outputPath?: string;
  templatesOutputPath?: string;
}) {
  const yamlContent = await fs.readFile(inputPath, "utf8");
  const rawConfig = yaml.load(yamlContent);

  // Validate the config
  const parsedConfig = configSchema.parse(rawConfig);

  // Generate the TypeScript file
  // Initialize ts-morph project
  const project = new Project();
  const templatesFile = project.createSourceFile(outputPath, "", { overwrite: true });
  const typesFile = project.createSourceFile(templatesOutputPath, "", { overwrite: true });

  // Set the ProviderName enum based on the schema providers
  typesFile
    .addEnum({
      name: "ProviderName",
      members: Object.keys(parsedConfig.actions).map(providerName => ({
        name: providerName.toUpperCase().replace(/-/g, "_"),
        value: providerName,
      })),
    })
    .setIsExported(true);

  typesFile
    .addEnum({
      name: "ActionName",
      members: Array.from(new Set(Object.values(parsedConfig.actions).flatMap(provider => Object.keys(provider)))).map(
        actionName => ({
          name: actionName.toUpperCase().replace(/-/g, "_"),
          value: actionName,
        }),
      ),
    })
    .setIsExported(true);

  // Add imports
  templatesFile.addImportDeclaration({
    moduleSpecifier: "../../actions/parse",
    namedImports: ["ActionTemplate"],
  });
  typesFile.addImportDeclaration({
    moduleSpecifier: "zod",
    namedImports: ["z"],
  });

  // Initialization: set up generic ActionFunction type
  typesFile.addTypeAlias({
    name: "ActionFunction",
    typeParameters: ["P", "A", "O"],
    type: "(input: {params: P, authParams: A}) => Promise<O>",
    isExported: true,
  });
  // Initialization: set up authparams zod schema and type
  typesFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "AuthParamsSchema",
        initializer: authParamsSchemaStr,
      },
    ],
  });
  typesFile.addTypeAlias({
    name: "AuthParamsType",
    type: "z.infer<typeof AuthParamsSchema>",
    isExported: true,
  });

  // ActionTag enum for action-level tags (using values defined at top of file)
  typesFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "ActionTagSchema",
        initializer: `z.enum([${actionTagValues.map(t => `"${t}"`).join(", ")}])`,
      },
    ],
  });

  typesFile.addTypeAlias({
    name: "ActionTag",
    type: "z.infer<typeof ActionTagSchema>",
    isExported: true,
  });

  typesFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "ACTION_TAGS",
        initializer: `[${actionTagValues.map(t => `"${t}"`).join(", ")}] as const`,
      },
    ],
  });

  // ParameterTag enum for parameter property tags (using values defined at top of file)
  typesFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "ParameterTagSchema",
        initializer: `z.enum([${parameterTagValues.map(t => `"${t}"`).join(", ")}])`,
      },
    ],
  });

  typesFile.addTypeAlias({
    name: "ParameterTag",
    type: "z.infer<typeof ParameterTagSchema>",
    isExported: true,
  });

  typesFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "PARAMETER_TAGS",
        initializer: `[${parameterTagValues.map(t => `"${t}"`).join(", ")}] as const`,
      },
    ],
  });

  for (const [categoryName, category] of Object.entries(parsedConfig.actions)) {
    for (const [actionName, action] of Object.entries(category)) {
      // Validate action-level tags
      if (action.tags && action.tags.length > 0) {
        const invalidTags = action.tags.filter(
          tag => !actionTagValues.includes(tag as (typeof actionTagValues)[number]),
        );
        if (invalidTags.length > 0) {
          throw new Error(
            `Action "${categoryName}.${actionName}" has invalid tag values: ${invalidTags.join(", ")}. Valid values are: ${actionTagValues.join(", ")}`,
          );
        }
      }

      if (action.parameters) {
        await validateObject(action.parameters);
      }

      if (action.output) {
        await validateObject(action.output);
      }

      const actionPrefix = `${categoryName}${snakeToPascal(actionName)}`;
      const constName = `${actionPrefix}Definition`;

      // Convert the action definition to a string representation
      const templateObj = {
        provider: categoryName,
        name: actionName,
        ...action,
      };

      // Validate the template object
      const template = actionTemplateSchema.parse(templateObj);

      // Add the constant declaration
      const templateStr = JSON.stringify(template, null, 4);
      templatesFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: constName,
            type: "ActionTemplate",
            initializer: templateStr,
          },
        ],
      });

      // parameter types
      await addActionTypes({
        file: typesFile,
        prefix: actionPrefix,
        action,
      });
    }
  }

  // Save the generated TypeScript file
  await templatesFile.save();
  await typesFile.save();
}

generateTypes({}).catch(error => {
  console.error("Error generating types:", error);
  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  }
  process.exit(1);
});
