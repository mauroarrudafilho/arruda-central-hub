import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  accessorKey: string;
  header: string;
  cell?: ({ row }: any) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ 
  columns, 
  data, 
  loading = false, 
  onRowClick 
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row: any, index) => (
              <TableRow 
                key={index}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    {column.cell 
                      ? column.cell({ row: { original: row } })
                      : String(row[column.accessorKey] || '-')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}