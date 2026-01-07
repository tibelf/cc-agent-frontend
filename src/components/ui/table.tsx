'use client'

import React, { useState, useMemo } from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  X
} from 'lucide-react'

export interface TableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  filterType?: 'select' | 'search' | 'date'
  filterOptions?: { label: string; value: any }[]
}

export interface TableFilter {
  column: string
  value: any
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between'
}

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    onPageChange?: (page: number, pageSize: number) => void
  }
  sorting?: {
    defaultSort?: TableSort
    onSortChange?: (sort: TableSort | null) => void
  }
  filtering?: {
    onFilterChange?: (filters: TableFilter[]) => void
  }
  rowKey?: keyof T | ((record: T) => string)
  onRowClick?: (record: T, index: number) => void
  className?: string
  emptyText?: string
  rowClassName?: (record: T, index: number) => string
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  filtering,
  rowKey = 'id' as keyof T,
  onRowClick,
  className = '',
  emptyText = '暂无数据',
  rowClassName
}: TableProps<T>) {
  const [currentSort, setCurrentSort] = useState<TableSort | null>(sorting?.defaultSort || null)
  const [filters, setFilters] = useState<TableFilter[]>([])
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({})

  // 处理排序
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    let newSort: TableSort | null = null
    
    if (!currentSort || currentSort.column !== columnKey) {
      newSort = { column: columnKey, direction: 'asc' }
    } else if (currentSort.direction === 'asc') {
      newSort = { column: columnKey, direction: 'desc' }
    } else {
      newSort = null
    }
    
    setCurrentSort(newSort)
    sorting?.onSortChange?.(newSort)
  }

  // 处理搜索筛选
  const handleSearchFilter = (columnKey: string, value: string) => {
    setSearchInputs(prev => ({ ...prev, [columnKey]: value }))
    
    const newFilters = filters.filter(f => f.column !== columnKey)
    if (value.trim()) {
      newFilters.push({ 
        column: columnKey, 
        value: value.trim(), 
        operator: 'contains' 
      })
    }
    
    setFilters(newFilters)
    filtering?.onFilterChange?.(newFilters)
  }

  // 处理选择筛选
  const handleSelectFilter = (columnKey: string, value: any) => {
    const newFilters = filters.filter(f => f.column !== columnKey)
    if (value !== '' && value !== null && value !== undefined) {
      newFilters.push({ 
        column: columnKey, 
        value, 
        operator: 'equals' 
      })
    }
    
    setFilters(newFilters)
    filtering?.onFilterChange?.(newFilters)
  }

  // 清除筛选
  const clearFilter = (columnKey: string) => {
    setFilters(prev => prev.filter(f => f.column !== columnKey))
    setSearchInputs(prev => ({ ...prev, [columnKey]: '' }))
    filtering?.onFilterChange?.(filters.filter(f => f.column !== columnKey))
  }

  // 数据处理（本地模式）
  const processedData = useMemo(() => {
    let result = [...data]

    // 应用筛选
    if (filters.length > 0) {
      result = result.filter(record => {
        return filters.every(filter => {
          const value = getNestedValue(record, filter.column)
          const filterValue = filter.value
          
          switch (filter.operator) {
            case 'contains':
              return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
            case 'equals':
            default:
              return value === filterValue
          }
        })
      })
    }

    // 应用排序
    if (currentSort) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, currentSort.column)
        const bValue = getNestedValue(b, currentSort.column)
        
        let comparison = 0
        if (aValue < bValue) comparison = -1
        else if (aValue > bValue) comparison = 1
        
        return currentSort.direction === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [data, filters, currentSort])

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData
    
    const { page, pageSize } = pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return processedData.slice(startIndex, endIndex)
  }, [processedData, pagination])

  const getSortIcon = (columnKey: string) => {
    if (!currentSort || currentSort.column !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return currentSort.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary" />
      : <ChevronDown className="h-4 w-4 text-primary" />
  }

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return String(record[rowKey] || index)
  }

  if (loading) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 表格容器 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* 表头 */}
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={String(column.key)}
                    className={`
                      px-4 py-3 text-left text-sm font-medium text-muted-foreground
                      ${column.sortable ? 'cursor-pointer hover:bg-muted/80' : ''}
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.title}</span>
                      {column.sortable && getSortIcon(String(column.key))}
                    </div>
                  </th>
                ))}
              </tr>
              
              {/* 筛选行 */}
              <tr className="bg-background">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-2">
                    {column.filterable && (
                      <div className="flex items-center space-x-1">
                        {column.filterType === 'select' ? (
                          <select
                            className="text-xs border border-input rounded px-2 py-1 bg-background min-w-[100px]"
                            onChange={(e) => handleSelectFilter(String(column.key), e.target.value)}
                          >
                            <option value="">全部</option>
                            {column.filterOptions?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={`筛选${column.title}...`}
                              value={searchInputs[String(column.key)] || ''}
                              onChange={(e) => handleSearchFilter(String(column.key), e.target.value)}
                              className="text-xs border border-input rounded px-2 py-1 pr-6 bg-background min-w-[120px]"
                            />
                            <Search className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        
                        {filters.some(f => f.column === String(column.key)) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => clearFilter(String(column.key))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </thead>

            {/* 表体 */}
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                paginatedData.map((record, index) => (
                  <tr
                    key={getRowKey(record, index)}
                    className={`
                      border-t hover:bg-muted/50 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${rowClassName ? rowClassName(record, index) : ''}
                    `}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {columns.map((column) => {
                      const value = getNestedValue(record, String(column.key))
                      return (
                        <td
                          key={String(column.key)}
                          className={`
                            px-4 py-3 text-sm
                            ${column.align === 'center' ? 'text-center' : ''}
                            ${column.align === 'right' ? 'text-right' : ''}
                          `}
                        >
                          {column.render ? column.render(value, record, index) : value}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页器 */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {pagination.total} 条记录
            {pagination.total > 0 && (
              <span>
                ，当前显示第 {(pagination.page - 1) * pagination.pageSize + 1} - {' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {pagination.showSizeChanger && (
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageChange?.(1, Number(e.target.value))}
                className="text-sm border border-input rounded px-2 py-1 bg-background"
              >
                {(pagination.pageSizeOptions || [10, 20, 50, 100]).map(size => (
                  <option key={size} value={size}>{size}条/页</option>
                ))}
              </select>
            )}
            
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => pagination.onPageChange?.(1, pagination.pageSize)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => pagination.onPageChange?.(pagination.page - 1, pagination.pageSize)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
                {pagination.page}
              </span>
              
              <span className="text-sm text-muted-foreground">
                / {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => pagination.onPageChange?.(pagination.page + 1, pagination.pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => pagination.onPageChange?.(Math.ceil(pagination.total / pagination.pageSize), pagination.pageSize)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}