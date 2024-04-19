import React, { useState, useEffect} from 'react';
import { Checkbox } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Category {
  fields: {
    title: string;
    slug: string;
    parentCategory: object;
  }
  sys: {
    id: string;
  }
  childs?: Category[];
  parent?: Category;
}
const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = sdk.cma;
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(sdk.field.getValue() || []);
  useEffect(() => {
    sdk.window.startAutoResizer();
    const fetchData = async () => {
      try {
        const response = await cma.entry.getMany({
          query: {
            content_type: 'category'
          }
        });
        const updatedCategories = buildCategoryTree(response.items);
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Handle error
      }
    };
    fetchData();
  }, [sdk, cma]);
  
  // Recursive function to build category tree
  const buildCategoryTree = (categories: Category[]): [] => {
    const categoryMap: { [key: string]: Category } = {};
    const topLevelCategories: Category[] = [];
    
    // Create a map of categories using their IDs
    categories.forEach(category => {
      categoryMap[category.sys.id] = { ...category, childs:[] };
    });
    categories.forEach(category => {
      if (category.fields.parentCategory && category.fields.parentCategory['en-US'].sys.id in categoryMap) {
        const parentCategory = categoryMap[category.fields.parentCategory['en-US'].sys.id];
        categoryMap[category.sys.id].parent = parentCategory;
        parentCategory.childs.push(categoryMap[category.sys.id]);
      } else {
        topLevelCategories.push(categoryMap[category.sys.id]);
      }
    });
    
    return topLevelCategories;
  };
  
  
  // @ts-ignore
  const handleCheckboxChange = (category) => {
    const updatedCategories = selectedCategories.some(selected => selected.sys.id === category.sys.id)
      ? selectedCategories.filter(selected => selected.sys.id !== category.sys.id)
      : [...selectedCategories, {
        sys: {
          type:"Link",
          linkType: "Entry",
          id: category.sys.id
        }
      }];

    setSelectedCategories(updatedCategories);
    sdk.field.setValue(updatedCategories);
  };
  
  const renderCategories = (category: Category) => {
    const isChecked = selectedCategories.some(selected => selected.sys.id === category.sys.id);
    const isChild = !!category.parent;
    
    console.log(isChild, 'isChild');
    return (
      <div key={category.sys.id} style={{ marginLeft: isChild ? '20px' : '0' }}>
        <Checkbox
          id={category.sys.id}
          name={category.fields.title['en-US']}
          isChecked={isChecked}
          onChange={() => handleCheckboxChange(category)}
        >
          {category.fields.title['en-US']}
        </Checkbox>
        {category.childs && category.childs.map(child => renderCategories(child))}
      </div>
    );
  };
  const parentCategories = categories.filter(category => !category.fields.parentCategory);


  return (
    <div>
      {parentCategories.map(parentCategory => renderCategories(parentCategory))}
    </div>
  );
};

export default Field;
