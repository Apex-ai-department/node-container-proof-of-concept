import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Table,
  Checkbox,
  Button,
  Stack,
  Message,
  toaster,
  Panel,
  Input,
  InputGroup,
  SelectPicker,
} from "rsuite";

const { Column, HeaderCell, Cell } = Table;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uniqueUsers, setUniqueUsers] = useState([]);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        // Debug: check for <a> in any field
        data.forEach((row) => {
          if (
            (row.company_name && row.company_name.includes("<a")) ||
            (row.raw_ocr && row.raw_ocr.includes("<a"))
          ) {
            console.warn("Potential <a> tag in data:", row);
          }
        });
        setInvoices(data);
        setFilteredInvoices(data);
        // Extract unique users
        const users = [
          ...new Set(data.map((invoice) => invoice.uploader_name)),
        ];
        setUniqueUsers(users.map((user) => ({ label: user, value: user })));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.company_name
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        invoice.price?.toString().includes(searchText) ||
        invoice.date?.toLowerCase().includes(searchText) ||
        invoice.raw_ocr?.toLowerCase().includes(searchText);

      const matchesUser =
        !selectedUser || invoice.uploader_name === selectedUser;

      return matchesSearch && matchesUser;
    });
    setFilteredInvoices(filtered);
  }, [searchText, invoices, selectedUser]);

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === invoices.length) {
      setSelected([]);
    } else {
      setSelected(invoices.map((inv) => inv.id));
    }
  };

  const exportToExcel = () => {
    const exportData = filteredInvoices.filter((inv) =>
      selected.includes(inv.id)
    );
    if (exportData.length === 0) {
      toaster.push(<Message type="warning">No receipt selected.</Message>);
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "selected_invoices.xlsx");
    toaster.push(<Message type="success">Exported to Excel!</Message>);
  };

  return (
    <Panel
      bordered
      shaded
      style={{ maxWidth: 1200, margin: "40px auto", background: "#fff" }}
    >
      <Stack
        spacing={16}
        alignItems="center"
        justifyContent="space-between"
        style={{ marginBottom: 24 }}
      >
        <h2
          style={{ fontWeight: 700, fontSize: 28, color: "#1675e0", margin: 0 }}
        >
          Receipt
        </h2>
        <Stack spacing={16}>
          <Stack spacing={8} direction="column" alignItems="flex-start">
            <SelectPicker
              data={uniqueUsers}
              placeholder="Filter by user"
              value={selectedUser}
              onChange={setSelectedUser}
              style={{ width: 250 }}
              cleanable
            />
            <InputGroup>
              <Input
                placeholder="Search receipts..."
                value={searchText}
                onChange={setSearchText}
                style={{ width: 250 }}
              />
            </InputGroup>
          </Stack>
          <Button
            appearance="primary"
            color="green"
            disabled={selected.length === 0}
            onClick={exportToExcel}
          >
            Export Selected to Excel
          </Button>
        </Stack>
      </Stack>
      <Table
        data={filteredInvoices}
        autoHeight
        bordered
        cellBordered
        loading={loading}
        rowClassName={(rowData) =>
          rowData && rowData.id && selected.includes(rowData.id)
            ? "rs-table-row-selected"
            : ""
        }
        style={{ fontSize: 16 }}
      >
        <Column width={50} align="center" fixed>
          <HeaderCell>
            <Checkbox
              checked={
                selected.length === invoices.length && invoices.length > 0
              }
              indeterminate={
                selected.length > 0 && selected.length < invoices.length
              }
              onChange={handleSelectAll}
            />
          </HeaderCell>
          <Cell>
            {(rowData) => (
              <Checkbox
                checked={selected.includes(rowData.id)}
                onChange={() => handleSelect(rowData.id)}
              />
            )}
          </Cell>
        </Column>
        <Column width={60} align="center" fixed>
          <HeaderCell>ID</HeaderCell>
          <Cell dataKey="id" />
        </Column>
        <Column width={200} resizable>
          <HeaderCell>Company Name</HeaderCell>
          <Cell dataKey="company_name" />
        </Column>
        <Column width={120} resizable>
          <HeaderCell>Total Amount</HeaderCell>
          <Cell dataKey="price" />
        </Column>
        <Column width={120} resizable>
          <HeaderCell>Date</HeaderCell>
          <Cell dataKey="date" />
        </Column>
        <Column width={120} resizable>
          <HeaderCell>Uploader</HeaderCell>
          <Cell dataKey="uploader_name" />
        </Column>
        <Column width={240} flexGrow={1}>
          <HeaderCell>OCR Text</HeaderCell>
          <Cell>
            {(rowData) => (
              <details>
                <summary style={{ cursor: "pointer", color: "#1675e0" }}>
                  Show
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    maxWidth: 400,
                    fontSize: 12,
                    background: "#f7f7fa",
                    padding: 8,
                    borderRadius: 4,
                  }}
                >
                  {rowData.raw_ocr}
                </pre>
              </details>
            )}
          </Cell>
        </Column>
        <Column width={160} resizable>
          <HeaderCell>Created At</HeaderCell>
          <Cell dataKey="created_at" />
        </Column>
      </Table>
      {filteredInvoices.length === 0 && !loading && (
        <Message type="info" style={{ marginTop: 24 }}>
          No invoices found.
        </Message>
      )}
    </Panel>
  );
}
