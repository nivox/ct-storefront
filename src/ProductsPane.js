import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

function ProductEntry({product, lang}) {
  return (
    <Card>
      <Card.Img variant="top" style={{height: "40vh", width: "100%", "objectFit": "scale-down"}} src={product.productProjection.masterVariant.images[0].url} />
      <Card.Body>
        <Card.Title>{product.productProjection.name[lang]}</Card.Title>
        <Card.Text>{product.productProjection.description ? product.productProjection.description[lang] : "No description"}</Card.Text>
      </Card.Body>
    </Card>
  )
}


function ProductsPane({products, total, lang}) {
  const productEntries = products.map( p => <ProductEntry key={p.id} product={p} lang={lang} />);

  return (
    <div>
      <p>Found {total} products</p>
      {productEntries}
    </div>
  )
}

export default ProductsPane;
