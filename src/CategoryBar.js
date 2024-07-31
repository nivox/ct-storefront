import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import ListGroup from 'react-bootstrap/ListGroup';

function CategoryBar({selectedCategoryId, setSelectedCategoryId, categoryTree, lang = "en"}) {
  let breadcrumbItems = [];
  if (selectedCategoryId) {
    const currentPath = categoryTree.getPathToRoot(selectedCategoryId);
    breadcrumbItems.push(<Breadcrumb.Item key="all" onClick={_ => setSelectedCategoryId(null)}>All</Breadcrumb.Item>);
    for (let i=0; i<currentPath.length; i++) {
      let c = currentPath[i]; 
      if (i === currentPath.length - 1) {
        breadcrumbItems.push(<Breadcrumb.Item key={c.id} active>{c.name[lang]}</Breadcrumb.Item>);
      } else {
        breadcrumbItems.push(<Breadcrumb.Item key={c.id} onClick={_ => setSelectedCategoryId(c.id)}>{c.name[lang]}</Breadcrumb.Item>);
      }
    }
  } 
  const categories = (selectedCategoryId ? categoryTree.getChildren(selectedCategoryId) : categoryTree.getRoots()).map( c =>
    <ListGroup.Item key={c.id} action onClick={_ => setSelectedCategoryId(c.id)}>{c.name[lang]}</ListGroup.Item>
  )

  return (
    <Container>
      <Row>
        <Col>
          <Breadcrumb>
            {breadcrumbItems}
          </Breadcrumb>
        </Col>
      </Row>
      <Row>
        <Col>
          <ListGroup>
            {categories}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  )
}

export default CategoryBar;
