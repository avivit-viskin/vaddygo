/*
  Table — טבלה גנרית.
  columns: [{ key, header, render? }] — render אופציונלי לעיצוב תא מותאם.
  rows: מערך אובייקטים. keyField: שם השדה המזהה (ברירת מחדל: id).
*/
function Table({ columns, rows, keyField = "id" }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
