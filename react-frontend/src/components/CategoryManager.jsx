import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi'
import ConfirmationModal from './ConfirmationModal'
import toast from 'react-hot-toast'

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const handleAdd = (data) => {
    onAdd(data)
    setShowAdd(false)
    reset()
  }

  const handleEdit = (cat) => {
    setEditing(cat)
    reset({ name: cat.name, color: cat.color })
  }

  const handleUpdate = (data) => {
    onUpdate(editing.id, data)
    setEditing(null)
    reset()
  }

  const handleDelete = () => {
    onDelete(deleting.id)
    setDeleting(null)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}>
          <HiOutlinePlus className="mr-2" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
              <span>{cat.name}</span>
              {cat.is_default && <span className="badge badge-ghost badge-xs">default</span>}
            </div>
            {!cat.is_default && (
              <div>
                <button className="btn btn-xs btn-ghost" onClick={() => handleEdit(cat)}><HiOutlinePencil /></button>
                <button className="btn btn-xs btn-ghost text-error" onClick={() => setDeleting(cat)}><HiOutlineTrash /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">New Category</h3>
            <form onSubmit={handleSubmit(handleAdd)}>
              <Input
                label="Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
              <div className="form-control mt-4">
                <label className="label">Color</label>
                <input type="color" className="input input-bordered w-full" {...register('color')} />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Edit Category</h3>
            <form onSubmit={handleSubmit(handleUpdate)}>
              <Input
                label="Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
              <div className="form-control mt-4">
                <label className="label">Color</label>
                <input type="color" className="input input-bordered w-full" {...register('color')} />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmationModal
          title="Delete Category"
          message={`Delete "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

// Import Input at top
import Input from './Forms/Input'