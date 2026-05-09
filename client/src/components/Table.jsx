export default function Table({ columns, data, loading, emptyMsg = 'No records found.' }) {
  if (loading) return (
    <div className="spinner-center"><div className="spinner spinner-lg" /></div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c.key || c.label}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {!data?.length
            ? <tr><td colSpan={columns.length} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>{emptyMsg}</td></tr>
            : data.map((row, i) => (
                <tr key={row._id || i}>
                  {columns.map(col => (
                    <td key={col.key || col.label}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  );
}