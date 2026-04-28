import { useState, useEffect } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryStats } from '../services/categories'
import { getExpenses } from '../services/expenses'
import ConfirmationModal from '../components/ConfirmationModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlinePlus,
  HiOutlineTag,
  HiOutlineColorSwatch,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineFolder,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi'
import toast from 'react-hot-toast'

// Predefined color palette for easy selection
const COLOR_PALETTE = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Rose', value: '#f43f5e' },
]

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [categoryStats, setCategoryStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6' })
  const [expenseCounts, setExpenseCounts] = useState({})
  const [categoryTotals, setCategoryTotals] = useState({})
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchCategoryUsageStats()
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load categories data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Failed to load categories')
      throw error
    }
  }

  const fetchCategoryUsageStats = async () => {
    try {
      const expenses = await getExpenses({ per_page: 1000 })
      
      const counts = {}
      const totals = {}
      
      expenses.items.forEach(exp => {
        if (exp.category_id) {
          counts[exp.category_id] = (counts[exp.category_id] || 0) + 1
          totals[exp.category_id] = (totals[exp.category_id] || 0) + exp.amount
        }
      })
      
      setExpenseCounts(counts)
      setCategoryTotals(totals)
      
      try {
        const stats = await getCategoryStats()
        setCategoryStats(stats)
      } catch (error) {
        console.log('Category stats endpoint not available, using local calculations')
      }
    } catch (error) {
      console.error('Failed to fetch category usage stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
    toast.success('Categories refreshed')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        toast.success('Category updated successfully!')
      } else {
        await createCategory(formData)
        toast.success('Category created successfully!')
      }
      await fetchAllData()
      setShowForm(false)
      setEditingCategory(null)
      setFormData({ name: '', color: '#3b82f6' })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCategory(deletingCategory.id)
      toast.success('Category deleted successfully!')
      await fetchAllData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Deletion failed')
    } finally {
      setDeletingCategory(null)
    }
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, color: cat.color })
    setShowForm(true)
  }

  const selectColor = (colorValue) => {
    setFormData({ ...formData, color: colorValue })
    setShowColorPicker(false)
  }

  const getCategoryStats = () => {
    const total = categories.length
    const custom = categories.filter(c => !c.is_default).length
    const default_cats = categories.filter(c => c.is_default).length
    
    const totalExpenses = Object.values(expenseCounts).reduce((sum, count) => sum + count, 0)
    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
    
    return { 
      total, 
      custom, 
      default: default_cats,
      totalExpenses,
      totalSpent
    }
  }

  const stats = getCategoryStats()

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              Organize your expenses with custom categories
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button 
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <HiOutlineRefresh className={`text-lg md:text-xl ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', color: '#3b82f6' })
                setShowForm(true)
              }}
            >
              <HiOutlinePlus className="text-lg md:text-xl" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <HiOutlineFolder className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Categories</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <HiOutlineTag className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Custom</p>
                <p className="text-xl md:text-2xl font-bold">{stats.custom}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <HiOutlineChartBar className="text-2xl text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Default</p>
                <p className="text-xl md:text-2xl font-bold">{stats.default}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HiOutlineCurrencyDollar className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-xl md:text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">No categories found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first category to start organizing your expenses
            </p>
            <button 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', color: '#3b82f6' })
                setShowForm(true)
              }}
            >
              <HiOutlinePlus className="text-lg" />
              Create Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map(cat => {
              const expenseCount = expenseCounts[cat.id] || 0
              const totalAmount = categoryTotals[cat.id] || 0
              
              return (
                <div 
                  key={cat.id} 
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                        style={{ backgroundColor: cat.color }}
                      >
                        <HiOutlineTag />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cat.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {cat.is_default ? 'Default Category' : 'Custom Category'}
                        </p>
                      </div>
                    </div>
                    
                    {!cat.is_default && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(cat)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                          title="Edit category"
                        >
                          <HiOutlinePencil className="text-blue-600 dark:text-blue-400" />
                        </button>
                        <button 
                          onClick={() => setDeletingCategory(cat)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                          title="Delete category"
                          disabled={expenseCount > 0}
                        >
                          <HiOutlineTrash className={expenseCount > 0 ? 'text-gray-400' : 'text-red-600 dark:text-red-400'} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Color Preview */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Color:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{cat.color}</span>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
                      <p className="text-lg font-semibold">{expenseCount}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">${totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Warning if category has expenses */}
                  {expenseCount > 0 && cat.is_default === false && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Has {expenseCount} expense{expenseCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowForm(false)
                      setEditingCategory(null)
                      setFormData({ name: '', color: '#3b82f6' })
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <HiOutlineX className="text-xl" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Category Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Groceries, Rent, Entertainment"
                        autoFocus
                        required
                      />
                    </div>

                    {/* Color Selection - Easy Picker */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color
                      </label>
                      
                      {/* Selected color display */}
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
                        <div 
                          className="w-10 h-10 rounded-lg"
                          style={{ backgroundColor: formData.color }}
                        />
                        <span className="text-sm font-mono">{formData.color}</span>
                      </div>

                      {/* Color Palette */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select:</p>
                        <div className="grid grid-cols-6 gap-2">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => selectColor(color.value)}
                              className={`w-8 h-8 rounded-lg hover:scale-110 transition-transform ${
                                formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Custom hex input */}
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Or enter custom hex:</p>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500">#</span>
                          <input
                            type="text"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                            value={formData.color.replace('#', '')}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
                              setFormData({ ...formData, color: `#${val || '3b82f6'}` })
                            }}
                            placeholder="3b82f6"
                            maxLength="6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Live Preview</p>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                          style={{ backgroundColor: formData.color }}
                        >
                          <HiOutlineTag />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{formData.name || 'Category Name'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Preview style</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setShowForm(false)
                        setEditingCategory(null)
                        setFormData({ name: '', color: '#3b82f6' })
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!formData.name.trim()}
                    >
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deletingCategory && (
          <ConfirmationModal
            title="Delete Category"
            message={`Are you sure you want to delete "${deletingCategory.name}"?`}
            warning={expenseCounts[deletingCategory.id] > 0 ? 
              `This category has ${expenseCounts[deletingCategory.id]} expense(s) associated with it. You'll need to reassign these expenses first.` : 
              ''}
            onConfirm={handleDelete}
            onCancel={() => setDeletingCategory(null)}
            confirmDisabled={expenseCounts[deletingCategory.id] > 0}
          />
        )}
      </div>
    </div>
  )
}