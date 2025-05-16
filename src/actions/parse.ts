import Ajv from "ajv";
import fs from "fs/promises";
import yaml from "js-yaml";
import convert from "json-schema-to-zod";
import type { SourceFile } from "ts-morph";
import { Project, VariableDeclarationKind } from "ts-morph";
import { z } from "zod";
import { snakeToPascal } from "../utils/string";

const jsonObjectSchema = z.object({
  type: z.string(),
  required: z.array(z.string()),
  properties: z.record(z.string(), z.any()), // Permissive for now, validate using JSON schema later
});

type JsonObjectSchema = z.infer<typeof jsonObjectSchema>;

const actionSchema = z.object({
  description: z.string(),
  scopes: z.array(z.string()),
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
})
`;

async function validateObject(object: JsonObjectSchema) {
  const ajv = new Ajv({
    strict: true,
    strictTypes: true,
    strictTuples: true,
    strictRequired: true,
  });
  // validate schema and check required fields
  const validParameters = ajv.validateSchema(object);
  if (!validParameters) {
    throw new Error(`Error validating object: ${JSON.stringify(ajv.errors, null, 4)}`);
  }

  // check required fields
  const requiredFields = object.required;
  for (const field of requiredFields) {
    if (!object.properties[field]) {
      throw new Error(`Required field ${field} is missing`);
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

  for (const [categoryName, category] of Object.entries(parsedConfig.actions)) {
    for (const [actionName, action] of Object.entries(category)) {
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

generateTypes({});
