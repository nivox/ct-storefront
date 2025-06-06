import { ProductPagedSearchResponse, ProductSearchResult } from '@commercetools/platform-sdk';
import { Card, Pagination, Image, Stack, Badge, Text } from '@mantine/core';

function ProductEntry(props: { product: ProductSearchResult, lang: string }) {
  const { product, lang } = props;
  const productProjection = product.productProjection;
  const images = productProjection?.masterVariant?.images

  return (
    <Card withBorder>
      <Card.Section>
        <Image src={images?.[0]?.url} style={{height: "20vh", width: "100%", "objectFit": "scale-down"}} fallbackSrc="https://placehold.co/300x200?text=Placeholder" radius="md" />
      </Card.Section>
      <Card.Section>
        <Text>{productProjection?.name[lang]}</Text>
        <Badge>{productProjection?.key}</Badge>
      </Card.Section>
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
  const productEntries = searchResponse.results.map((p) => <ProductEntry key={p.id} product={p} lang={lang} />);
  const total = searchResponse.total;
  const totalPages = Math.ceil(total / 10);
  const pagination = <Pagination value={page} onChange={triggerPagination} total={totalPages} />

  return (
    <Stack>
      <Text>Found {total} products ({totalPages} pages)</Text>
      {pagination}
      {productEntries}
      {pagination}
    </Stack>
  )
}

export default ProductsPane;
