// Query Builder in Prisma
class QueryBuilder {
  private model: any;
  private query: Record<string, unknown>;
  private prismaQuery: any = {};

  constructor(model: any, query: Record<string, unknown>) {
    this.model = model;
    this.query = query;
  }

  // SEARCH
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;

    if (searchTerm) {
      const orConditions = searchableFields.map((field) => {
        if (field.includes(".")) {
          const [relation, nestedField] = field.split(".");
          return {
            [relation]: {
              is: {
                [nestedField]: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          };
        }

        return {
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        };
      });

      this.addCondition({
        OR: orConditions,
      });
    }

    return this;
  }

  // FILTER
  filter() {
    const queryObj = { ...this.query };

    const excludeFields = [
      "searchTerm",
      "sort",
      "limit",
      "page",
      "fields",
      "date", // VERY IMPORTANT (fix your error)
    ];

    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, any> = {};

    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === null || value === "") continue;

      if (typeof value === "string" && value.includes("[")) {
        const [field, operator] = key.split("[");
        const op = operator.slice(0, -1);

        formattedFilters[field] = {
          [`${op}`]: isNaN(Number(value)) ? value : Number(value),
        };
      } else {
        formattedFilters[key] = value;
      }
    }

    this.addCondition(formattedFilters);

    return this;
  }

  // RAW FILTER (for complex relation)
  rawFilter(filters: Record<string, any>) {
    this.addCondition(filters);
    return this;
  }

  // COMMON MERGE LOGIC (MAIN MAGIC 🔥)
  private addCondition(condition: Record<string, any>) {
    if (!this.prismaQuery.where) {
      this.prismaQuery.where = {};
    }

    if (!this.prismaQuery.where.AND) {
      this.prismaQuery.where.AND = [];
    }

    this.prismaQuery.where.AND.push(condition);
  }

  // SORT
  sort() {
    const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];

    const orderBy = sort.map((field) => {
      if (field.startsWith("-")) {
        const nested = field.slice(1).split(".");
        if (nested.length > 1) {
          return {
            [nested[0]]: { [nested[1]]: "desc" },
          };
        }
        return { [field.slice(1)]: "desc" };
      }

      const nested = field.split(".");
      if (nested.length > 1) {
        return {
          [nested[0]]: { [nested[1]]: "asc" },
        };
      }

      return { [field]: "asc" };
    });

    this.prismaQuery.orderBy = orderBy;

    return this;
  }

  // PAGINATION
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    this.prismaQuery.skip = (page - 1) * limit;
    this.prismaQuery.take = limit;

    return this;
  }

  // SELECT FIELDS
  fields() {
    const fields = (this.query.fields as string)?.split(",") || [];

    if (fields.length) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }

    return this;
  }

  // INCLUDE
  include(includableFields: Record<string, any>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...includableFields,
    };

    return this;
  }

  // EXECUTE
  async execute() {
    return this.model.findMany(this.prismaQuery);
  }

  // COUNT
  async countTotal() {
    const total = await this.model.count({
      where: this.prismaQuery.where,
    });

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    return {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    };
  }
}

export default QueryBuilder;