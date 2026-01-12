'use client'

import React, { useState, useMemo } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
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
  X,
  Grid3X3,
  List as ListIcon
} from 'lucide-react'

export interface ListColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'select' | 'search' | 'date'
  filterOptions?: { label: string; value: unknown }[]
}

export interface ListFilter {
  column: string
  value: unknown
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between'
}

export interface ListSort {
  column: string
  direction: 'asc' | 'desc'
}

export interface ListProps<T> {
  data: T[]
  loading?: boolean
  columns?: ListColumn<T>[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    onPageChange?: (page: number, pageSize: number) => void
  }
  sorting?: {
    defaultSort?: ListSort
    onSortChange?: (sort: ListSort | null) => void
  }
  filtering?: {
    onFilterChange?: (filters: ListFilter[]) => void
  }
  renderItem: (item: T, index: number) => React.ReactNode
  rowKey?: keyof T | ((record: T) => string)
  onItemClick?: (record: T, index: number) => void
  className?: string
  emptyText?: string
  itemClassName?: (record: T, index: number) => string
  showFilters?: boolean
  layout?: 'list' | 'grid'
  gridCols?: 1 | 2 | 3 | 4 | 6
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj)
}

export function List<T extends Record<string, unknown>>({
  data,
  loading = false,
  columns = [],
  pagination,
  sorting,
  filtering,
  renderItem,
  rowKey = 'id' as keyof T,
  onItemClick,
  className = '',
  emptyText = '暂无数据',
  itemClassName,
  showFilters = true,
  layout = 'list',
  gridCols = 1
}: ListProps<T>) {
  const [currentSort, setCurrentSort] = useState<ListSort | null>(sorting?.defaultSort || null)
  const [filters, setFilters] = useState<ListFilter[]>([])
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({})
  const [currentLayout, setCurrentLayout] = useState<'list' | 'grid'>(layout)

  // 处理排序
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    let newSort: ListSort | null = null
    
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
  const handleSelectFilter = (columnKey: string, value: unknown) => {
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

  // 清除所有筛选
  const clearAllFilters = () => {
    setFilters([])
    setSearchInputs({})
    filtering?.onFilterChange?.([])
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
        // Type assertion for comparison
        const a_val = aValue as string | number | Date
        const b_val = bValue as string | number | Date
        if (a_val < b_val) comparison = -1
        else if (a_val > b_val) comparison = 1
        
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const getGridClass = () => {
    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    }
    return gridClasses[gridCols] || gridClasses[1]
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      {(showFilters && columns.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* 排序和布局控制 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* 排序选项 */}
                  {columns.some(col => col.sortable) && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">排序:</span>
                      <select
                        value={currentSort ? `${currentSort.column}-${currentSort.direction}` : ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setCurrentSort(null)
                            sorting?.onSortChange?.(null)
                          } else {
                            const [column, direction] = e.target.value.split('-')
                            const newSort = { column, direction: direction as 'asc' | 'desc' }
                            setCurrentSort(newSort)
                            sorting?.onSortChange?.(newSort)
                          }
                        }}
                        className="text-sm border border-input rounded px-2 py-1 bg-background min-w-[120px]"
                      >
                        <option value="">默认排序</option>
                        {columns.filter(col => col.sortable).map(column => (
                          <React.Fragment key={String(column.key)}>
                            <option value={`${String(column.key)}-asc`}>
                              {column.title} ↑
                            </option>
                            <option value={`${String(column.key)}-desc`}>
                              {column.title} ↓
                            </option>
                          </React.Fragment>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 布局切换 */}
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant={currentLayout === 'list' ? 'default' : 'outline'}
                    onClick={() => setCurrentLayout('list')}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={currentLayout === 'grid' ? 'default' : 'outline'}
                    onClick={() => setCurrentLayout('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 筛选选项 */}
              {columns.some(col => col.filterable) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {columns.filter(col => col.filterable).map(column => (
                    <div key={String(column.key)} className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground min-w-[60px]">
                        {column.title}:
                      </span>
                      
                      {column.filterType === 'select' ? (
                        <select
                          className="flex-1 text-sm border border-input rounded px-2 py-1 bg-background"
                          onChange={(e) => handleSelectFilter(String(column.key), e.target.value)}
                        >
                          <option value="">全部</option>
                          {column.filterOptions?.map((option) => (
                            <option key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder={`筛选${column.title}...`}
                            value={searchInputs[String(column.key)] || ''}
                            onChange={(e) => handleSearchFilter(String(column.key), e.target.value)}
                            className="w-full text-sm border border-input rounded px-2 py-1 pr-6 bg-background"
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
                  ))}
                </div>
              )}

              {/* 清除筛选按钮 */}
              {filters.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      已应用 {filters.length} 个筛选条件
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllFilters}
                  >
                    清除所有筛选
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 数据统计 */}
      {processedData.length !== data.length && (
        <div className="text-sm text-muted-foreground">
          显示 {processedData.length} 条记录，共 {data.length} 条
        </div>
      )}

      {/* 列表内容 */}
      {paginatedData.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <p className="text-muted-foreground">{emptyText}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          currentLayout === 'grid' 
            ? `grid ${getGridClass()} gap-4`
            : 'space-y-4'
        }>
          {paginatedData.map((item, index) => (
            <div
              key={getRowKey(item, index)}
              className={`
                ${onItemClick ? 'cursor-pointer' : ''}
                ${itemClassName ? itemClassName(item, index) : ''}
              `}
              onClick={() => onItemClick?.(item, index)}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}

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