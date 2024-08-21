import Card from 'react-bootstrap/Card';
import Pagination from 'react-bootstrap/Pagination';

function ProductEntry({product, lang}) {
  return (
    <Card>
      <Card.Img variant="top" style={{height: "20vh", width: "100%", "objectFit": "scale-down"}} src={product.productProjection.masterVariant.images[0].url} />
      <Card.Body>
        <Card.Title>{product.productProjection.name[lang]}</Card.Title>
      </Card.Body>
    </Card>
  )
}


function ProductsPane({products, total, page, lang, triggerPagination}) {
  const productEntries = products.map( p => <ProductEntry key={p.id} product={p} lang={lang} />);

  const prev = page > 0 ? <Pagination.Prev onClick={() => triggerPagination(page-1)}/> : null;
  const next = total / 10 > (page + 1)   ? <Pagination.Next onClick={() => triggerPagination(page+1)}/> : null;

  return (
    <div>
      <p>Found {total} products ({Math.ceil(total / 10)} pages)</p>
      <Pagination>
        {prev}
        <Pagination.Item active>{page + 1}</Pagination.Item>
        {next}
      </Pagination>
      {productEntries}
    </div>
  )
}

export default ProductsPane;
