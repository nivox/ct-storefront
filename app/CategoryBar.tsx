import { Anchor, Breadcrumbs, Title } from '@mantine/core';
import { CategoryTree } from './utils';

function CategoryBar(props: { selectedCategoryId?: string, setSelectedCategoryId: (categoryId: string | null) => void, categoryTree: CategoryTree, lang: string }) {
  const { selectedCategoryId, setSelectedCategoryId, categoryTree, lang } = props;
  let breadcrumbItems = [];
  if (selectedCategoryId) {
    const currentPath = categoryTree.getPathToRoot(selectedCategoryId);
    breadcrumbItems.push(<Anchor key="all" onClick={_ => setSelectedCategoryId(null)}>All</Anchor>);
    for (let i = 0; i < currentPath.length; i++) {
      let c = currentPath[i];
      if (i === currentPath.length - 1) {
        breadcrumbItems.push(<Anchor key={c.id}>{c.name[lang]}</Anchor>);
      } else {
        breadcrumbItems.push(<Anchor key={c.id} onClick={_ => setSelectedCategoryId(c.id)}>{c.name[lang]}</Anchor>);
      }
    }
  }
  const categories = (selectedCategoryId ? categoryTree.getChildren(selectedCategoryId) : categoryTree.getRoots()).map(c =>
    <Anchor key={c.id} onClick={_ => setSelectedCategoryId(c.id)}>{c.name[lang]}</Anchor>
  )

  return (
    <>
      {selectedCategoryId ? <Title order={2}>Current Category</Title> : <></>}
      <Breadcrumbs>
        {breadcrumbItems}
      </Breadcrumbs>
      <Title order={3}>Categories</Title>
      <Breadcrumbs separator="">
      {categories}
      </Breadcrumbs>
    </>
  )
}

export default CategoryBar;
