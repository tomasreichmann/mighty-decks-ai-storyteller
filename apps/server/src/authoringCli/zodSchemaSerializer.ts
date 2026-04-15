import {
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEffects,
  ZodEnum,
  ZodFirstPartyTypeKind,
  ZodIntersection,
  ZodLiteral,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodRecord,
  ZodTypeAny,
  z,
} from "zod";

type JsonSchemaLike = Record<string, unknown>;

const extractChecks = (
  schema: z.ZodString | z.ZodNumber | z.ZodArray<ZodTypeAny>,
): JsonSchemaLike => {
  const checks = (schema._def as { checks?: Array<Record<string, unknown>> }).checks ?? [];
  const result: JsonSchemaLike = {};

  for (const check of checks) {
    const kind = typeof check.kind === "string" ? check.kind : "";
    if (kind === "min") {
      result.min = check.value;
    } else if (kind === "max") {
      result.max = check.value;
    } else if (kind === "regex") {
      result.pattern = String(check.regex);
    } else if (kind === "email") {
      result.format = "email";
    } else if (kind === "datetime") {
      result.format = "datetime";
    } else if (kind === "int") {
      result.integer = true;
    }
  }

  return result;
};

const withDescription = (
  schema: ZodTypeAny,
  value: JsonSchemaLike,
): JsonSchemaLike => {
  if (schema.description) {
    return {
      ...value,
      description: schema.description,
    };
  }
  return value;
};

export const serializeZodSchema = (schema: ZodTypeAny): JsonSchemaLike => {
  if (schema instanceof ZodEffects) {
    const inner = serializeZodSchema(schema.innerType());
    return withDescription(schema, {
      ...inner,
      effects: true,
    });
  }

  if (schema instanceof ZodDefault) {
    const inner = serializeZodSchema(schema.removeDefault());
    return withDescription(schema, {
      ...inner,
      default: schema._def.defaultValue(),
    });
  }

  if (schema instanceof ZodOptional) {
    return withDescription(schema, {
      ...serializeZodSchema(schema.unwrap()),
      optional: true,
    });
  }

  if (schema instanceof ZodNullable) {
    return withDescription(schema, {
      ...serializeZodSchema(schema.unwrap()),
      nullable: true,
    });
  }

  if (schema instanceof ZodObject) {
    const shape = schema.shape as Record<string, ZodTypeAny>;
    const properties = Object.fromEntries(
      Object.entries(shape).map(([key, value]) => [key, serializeZodSchema(value)]),
    );
    const required = Object.entries(shape)
      .filter(([, value]) => !(value instanceof ZodOptional) && !(value instanceof ZodDefault))
      .map(([key]) => key);
    return withDescription(schema, {
      type: "object",
      properties,
      required,
    });
  }

  if (schema instanceof z.ZodArray) {
    return withDescription(schema, {
      type: "array",
      items: serializeZodSchema(schema.element),
      ...extractChecks(schema),
    });
  }

  if (schema instanceof z.ZodString) {
    return withDescription(schema, {
      type: "string",
      ...extractChecks(schema),
    });
  }

  if (schema instanceof z.ZodNumber) {
    return withDescription(schema, {
      type: "number",
      ...extractChecks(schema),
    });
  }

  if (schema instanceof z.ZodBoolean) {
    return withDescription(schema, {
      type: "boolean",
    });
  }

  if (schema instanceof ZodEnum) {
    return withDescription(schema, {
      type: "string",
      enum: schema.options,
    });
  }

  if (schema instanceof ZodLiteral) {
    return withDescription(schema, {
      const: schema.value,
    });
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options as ZodTypeAny[];
    return withDescription(schema, {
      oneOf: options.map((option) => serializeZodSchema(option)),
    });
  }

  if (schema instanceof ZodDiscriminatedUnion) {
    const options = Array.from(schema.options.values()) as ZodTypeAny[];
    return withDescription(schema, {
      discriminator: schema.discriminator,
      oneOf: options.map((option) => serializeZodSchema(option)),
    });
  }

  if (schema instanceof ZodIntersection) {
    const left = schema._def.left as ZodTypeAny;
    const right = schema._def.right as ZodTypeAny;
    return withDescription(schema, {
      allOf: [
        serializeZodSchema(left),
        serializeZodSchema(right),
      ],
    });
  }

  if (schema instanceof ZodRecord) {
    const valueType = schema._def.valueType as ZodTypeAny;
    return withDescription(schema, {
      type: "record",
      valueType: serializeZodSchema(valueType),
    });
  }

  if (schema instanceof z.ZodNull) {
    return withDescription(schema, {
      type: "null",
    });
  }

  if (schema instanceof z.ZodAny) {
    return withDescription(schema, {
      type: "any",
    });
  }

  if (schema instanceof z.ZodUnknown) {
    return withDescription(schema, {
      type: "unknown",
    });
  }

  const typeName = (schema._def as { typeName?: string }).typeName;
  if (typeName === ZodFirstPartyTypeKind.ZodTuple) {
    const items = ((schema._def as { items?: ZodTypeAny[] }).items ?? []).map(
      (item) => serializeZodSchema(item),
    );
    return withDescription(schema, {
      type: "tuple",
      items,
    });
  }

  return withDescription(schema, {
    type: "unsupported",
    zodType: typeName ?? schema.constructor.name,
  });
};
