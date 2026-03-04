import { AttributeDefinition, AttributeType, ProductType } from "@commercetools/platform-sdk";

interface CategoryReference {
  id: string
}

interface Category {
  id: string,
  name: Record<string, string>,
  parent?: CategoryReference,
  ancestors: CategoryReference[]
}

export class CategoryTree {
  categoryMap: Record<string, Category>;
  childrenMap: Record<string, Category[]>;
  roots: Category[];
  constructor(categories: Category[]) {
    this.categoryMap = {};
    this.childrenMap = {};
    this.roots = [];

    categories.forEach(c => {
      this.categoryMap[c.id] = c;
      if (!c.parent) {
        this.roots.push(c);
      } else {
        if (!this.childrenMap[c.parent.id]) {
          this.childrenMap[c.parent.id] = [];
        }
        this.childrenMap[c.parent.id].push(c);
      }
    });
    console.log(`Loaded ${categories.length} categories with ${this.roots.length} roots.`);
  }

  get(categoryId: string) {
    return this.categoryMap[categoryId];
  }

  getRoots() {
    return this.roots;
  }

  getChildren(categoryId: string) {
    return this.childrenMap[categoryId] || [];
  }

  getPathToRoot(categoryId: string) {
    let c = this.categoryMap[categoryId];
    if (c) {
      let path = c.ancestors ? c.ancestors.map(c => this.categoryMap[c.id]) : [];
      path.push(c);
      return path;
    } else return [];
  }
}

const ignoredBaseTypes = new Set(["date", "datetime", "reference"]);

/**
 * For set types, returns the element type name; otherwise returns the type name directly.
 */
export function effectiveTypeName(type: AttributeType): string {
  if (type.name === 'set') {
    return (type as { name: 'set'; elementType: AttributeType }).elementType.name;
  }
  return type.name;
}

const validAttribute = (a: AttributeDefinition) => {
  if (!a.isSearchable) return false;
  const etype = effectiveTypeName(a.type);
  return !ignoredBaseTypes.has(etype);
}

export interface ProductAttribute {
  definition: AttributeDefinition,
  ignored: boolean
}

export class ProductTypeAttributes {
  productTypeAttributeMap: Record<string, ProductAttribute[]>;
  attributeMap: Record<string, ProductAttribute>;
  constructor(productTypes: ProductType[]) {
    this.productTypeAttributeMap = {};
    this.attributeMap = {};
    productTypes.forEach(pt => {
      this.productTypeAttributeMap[pt.id] = pt.attributes?.filter(validAttribute).map(a => { return {definition: a, ignored: false}}) || [];
      pt.attributes?.forEach(a => {
        if (validAttribute(a)) {
          console.log("valid", a);
          this.attributeMap[a.name] = { definition: a, ignored: false };
        }
      });
    });

    console.log(`Loaded ${productTypes.length} product types with ${Object.keys(this.attributeMap).length} searchable attributes.`)
  }

  getAttributes(productTypeId: string) {
    return (this.productTypeAttributeMap[productTypeId] || []).filter(a => !a.ignored);
  };

  getAttribute(attributeName: string) {
    return this.attributeMap[attributeName];
  }

  getAllAttributes() {
    return Object.values(this.attributeMap);
  }

  setIgnoreAttribute(attributeName: string, ignored: boolean) {
    this.attributeMap[attributeName].ignored = ignored;
  }
}
