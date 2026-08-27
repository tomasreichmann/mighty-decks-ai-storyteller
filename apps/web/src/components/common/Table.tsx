import type { ReactNode, TableHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Table.module.css";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  wrapperClassName?: string;
}

export const Table = ({
  children,
  className,
  wrapperClassName,
  ...tableProps
}: TableProps): JSX.Element => (
  <div className={cn(styles.scrollArea, wrapperClassName)}>
    <table
      className={cn(
        styles.table,
        "font-ui text-base leading-relaxed [&_th]:font-heading [&_th]:font-bold [&_th]:leading-tight",
        className,
      )}
      {...tableProps}
    >
      {children}
    </table>
  </div>
);
