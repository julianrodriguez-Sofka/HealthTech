import React from 'react';
import { motion } from 'framer-motion';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
    <table className={`w-full ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-gray-50 dark:bg-gray-900/50">
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
    {children}
  </tbody>
);

export const TableRow: React.FC<{ 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => (
  <motion.tr
    whileHover={onClick ? { backgroundColor: 'rgba(59, 130, 246, 0.05)' } : {}}
    onClick={onClick}
    className={`
      transition-colors
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </motion.tr>
);

export const TableHead: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <th className={`
    px-6 py-4 text-left text-xs font-semibold 
    text-gray-700 dark:text-gray-300 uppercase tracking-wider
    ${className}
  `}>
    {children}
  </th>
);

export const TableCell: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}> = ({ children, className = '', colSpan }) => (
  <td 
    colSpan={colSpan}
    className={`
    px-6 py-4 text-sm text-gray-900 dark:text-gray-100
    ${className}
  `}>
    {children}
  </td>
);
