import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

function SearchBar({ searchValue, setSearchValue, onTriggerSearch }) {

  function handleSearch(e) {
    if (e.key === 'Enter') {
      console.log('triggering search');
      onTriggerSearch();
    }
  }

  return (
    <Row>
      <Col>
        <Form.Control type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} onKeyPress={handleSearch} placeholder="Search..." />
      </Col>
    </Row>
  )
}

export default SearchBar;
