import Card from 'react-bootstrap/Card';
import Pagination from 'react-bootstrap/Pagination';
import { ProductPagedSearchResponse, ProductSearchResult } from '@commercetools/platform-sdk';
import { Col, Row } from 'react-bootstrap';

function ProductEntry(props: { product: ProductSearchResult, lang: string }) {
  const { product, lang } = props;
  const images = product.productProjection?.masterVariant?.images

  return (
    <Card>
      <Card.Img variant="top" style={{ height: "20vh", width: "100%", "objectFit": "scale-down" }} src={images && images[0] ? images[0].url : ""} />
      <Card.Body style={{ height: "150px", overflow: "auto" }}>
        <Card.Title>{product.productProjection?.name[lang]}</Card.Title>
      </Card.Body>
    </Card>
  )
}

interface ProductsPaneProps {
  searchResponse: ProductPagedSearchResponse,
  page: number,
  lang: string,
  triggerPagination: (page: number) => void
}

function ProductsPane({ searchResponse, page, lang, triggerPagination }: ProductsPaneProps) {
  const productEntries = searchResponse.results.map((p, index) => <Col key={index}><ProductEntry key={p.id} product={p} lang={lang} /></Col>);
  const total = searchResponse.total;

  const prev = page > 0 ? <Pagination.Prev onClick={() => triggerPagination(page - 1)} /> : null;
  const next = total / 10 > (page + 1) ? <Pagination.Next onClick={() => triggerPagination(page + 1)} /> : null;

  return (
    <div>
      <p>Found {total} products ({Math.ceil(total / 10)} pages)</p>
      <Pagination>
        {prev}
        <Pagination.Item active>{page + 1}</Pagination.Item>
        {next}
      </Pagination>
      <Row xs={1} md={2} lg={5} className="g-4">
        {productEntries}
      </Row>
    </div>
  )
}

export default ProductsPane;
