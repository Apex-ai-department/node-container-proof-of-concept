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

export default function DashboardPage() {
  // Job queue state
  const [jobQueue, setJobQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState(null);

  // Invoice states (existing)
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uniqueUsers, setUniqueUsers] = useState([]);

  // Fetch job queue from backend/redisqueue
  useEffect(() => {
    const fetchJobQueue = async () => {
      setLoadingQueue(true);
      try {
        const res = await fetch("/api/queue");
        if (!res.ok) throw new Error("Failed to fetch job queue");
        const data = await res.json();
        setJobQueue(data);
        setQueueError(null);
      } catch (err) {
        setQueueError(err.message);
      } finally {
        setLoadingQueue(false);
      }
    };
    fetchJobQueue();
    const intervalId = setInterval(fetchJobQueue, 5000); // Poll every 5s
    return () => clearInterval(intervalId);
  }, []);

  // Fetch job data from PostgreSQL
    useEffect(() => {
    const fetchJobsFromPostgres = async () => {
        setLoadingQueue(true);
        try {
        const res = await fetch("/api/db/jobs");
        if (!res.ok) throw new Error("Failed to fetch jobs from database");
        const data = await res.json();
        setJobQueue(data);
        setQueueError(null);
        } catch (err) {
        setQueueError(err.message);
        } finally {
        setLoadingQueue(false);
        }
    };
    fetchJobsFromPostgres();
    }, []);


  // Fetch invoices from backend
  useEffect(() => {
    fetch("/api/db")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setFilteredInvoices(data);
        const users = [...new Set(data.map((invoice) => invoice.uploader_name))];
        setUniqueUsers(users.map((user) => ({ label: user, value: user })));
        setLoadingInvoices(false);
      });
  }, []);

  // Filter invoices by search and user
  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        invoice.price?.toString().includes(searchText) ||
        invoice.date?.toLowerCase().includes(searchText) ||
        invoice.raw_ocr?.toLowerCase().includes(searchText);

      const matchesUser = !selectedUser || invoice.uploader_name === selectedUser;

      return matchesSearch && matchesUser;
    });
    setFilteredInvoices(filtered);
  }, [searchText, invoices, selectedUser]);

  // Invoice selection handlers
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

  // Export selected invoices to Excel
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
    <div
      style={{
        maxWidth: 1625,
        width: "100%",
        margin: "40px auto",
        background: "#fff",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Job Queue - Top Center */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Panel
          bordered
          shaded
          style={{
            width: "100%",
            maxWidth: 1625,
            textAlign: "center",
            padding: 20,
            boxSizing: "border-box"
          }}
        >
          <h3>Job Queue</h3>
          {loadingQueue && <p>Loading job queue...</p>}
          {queueError && <p style={{ color: "red" }}>Error: {queueError}</p>}
          {jobQueue.length === 0 && !loadingQueue && <p>No jobs in queue</p>}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            {jobQueue.map((job, i) => (
              <div
                key={i}
                style={{
                  minWidth: 140,
                  padding: 12,
                  backgroundColor:
                    job.status === "Pending"
                      ? "#f0ad4e"
                      : job.status === "Processing"
                      ? "#5bc0de"
                      : "#5cb85c",
                  color: "white",
                  borderRadius: 8,
                  fontWeight: "bold",
                  textAlign: "center",
                  cursor: "default",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div>Batch: {job.batchId || "N/A"}</div>
                <div>Status: {job.status || "N/A"}</div>
                <div>Uploader: {job.uploaderName || job.uploader_name || "N/A"}</div>
                <div>Files: {job.files ? job.files.join(", ") : "N/A"}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Lower section with job data (left) and invoices (right) */}
      <div style={{ display: "flex", gap: 24 }}>
        {/* Job Data (left) */}
        <Panel
          bordered
          shaded
          style={{
            flex: 1,
            minWidth: 300,
            minHeight: 400,
            maxHeight: 600,
            overflowY: "auto",
            padding: 20,
          }}
        >
          <h3>Job Data</h3>
          {jobQueue.length === 0 && <p>No job data available.</p>}
          {jobQueue.map((job, i) => (
            <div
              key={job.batchId || i}
              style={{
                minHeight: 400,
                marginBottom: 12,
                padding: 12,
                border: "1px solid #ccc",
                borderRadius: 6,
                background: "#fafafa",
              }}
            >
              <div><strong>Batch ID:</strong> {job.batchId || "N/A"}</div>
              <div><strong>Uploader Name:</strong> {job.uploaderName || job.uploader_name || "N/A"}</div>
              <div>
                <strong>Files:</strong>{" "}
                {job.files ? job.files.join(", ") : "N/A"}
              </div>
              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: "pointer", color: "#1675e0" }}>
                  Show Raw Data
                </summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {JSON.stringify(job, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </Panel>

        {/* Invoices (right) */}
        <Panel
          bordered
          shaded
          style={{ flex: 2, maxHeight: 600, overflowY: "auto", padding: 20 }}
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
            loading={loadingInvoices}
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
            <Column width={350} resizable>
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
            <Column width={100} resizable>
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
          {filteredInvoices.length === 0 && !loadingInvoices && (
            <Message type="info" style={{ marginTop: 24 }}>
              No invoices found.
            </Message>
          )}
        </Panel>
      </div>
    </div>
  );
}
