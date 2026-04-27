const Table = ({ columns, data, loading }) => {
  if (loading) return <p>Loading...</p>;

  if (!data || data.length === 0)
    return <p>No records found.</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i}>{col.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>
                {col.render
                  ? col.render(row)
                  : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;