import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  SearchInput,
  StatusBadge,
  useTranslation,
  toast,
} from '@niagantara/ui';
import { useDemoStore } from './demo-store';
import type { DemoProduct } from './demo-types';

export function DemoProducts() {
  const { t } = useTranslation();
  const { products, categories, addProduct, updateProduct, deleteProduct } =
    useDemoStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<DemoProduct | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    product: DemoProduct | null;
  }>({ open: false, product: null });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = (product: DemoProduct) => {
    if (editingProduct) {
      updateProduct(product.id, product);
      toast(t('demo.changesNotSaved'), 'success');
    } else {
      addProduct(product);
      toast(t('demo.changesNotSaved'), 'success');
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (product: DemoProduct) => {
    deleteProduct(product.id);
    toast(t('demo.changesNotSaved'), 'success');
    setDeleteConfirm({ open: false, product: null });
  };

  const openAddModal = () => {
    setEditingProduct({
      id: '',
      name: '',
      sku: '',
      category: categories[0]?.name || '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minimumStock: 0,
      unit: 'pcs',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: DemoProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="demo-products">
      <Card
        title={t('pages.products')}
        actions={<Button onClick={openAddModal}>+ {t('common.add')}</Button>}
      >
        <div className="demo-products-filters">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('common.search')}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t('demo.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="demo-products-table">
          <div className="demo-table-header">
            <span>{t('common.name')}</span>
            <span>SKU</span>
            <span>{t('common.category')}</span>
            <span>{t('common.costPrice')}</span>
            <span>{t('common.sellingPrice')}</span>
            <span>{t('common.stock')}</span>
            <span>{t('common.status')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {filteredProducts.map((product) => (
            <div key={product.id} className="demo-table-row">
              <span className="demo-product-name">{product.name}</span>
              <span className="demo-product-sku">{product.sku}</span>
              <span>{product.category}</span>
              <span>{formatCurrency(product.costPrice)}</span>
              <span>{formatCurrency(product.sellingPrice)}</span>
              <span
                className={
                  product.stock <= product.minimumStock ? 'demo-low-stock' : ''
                }
              >
                {product.stock} {product.unit}
              </span>
              <StatusBadge status={product.status} />
              <div className="demo-table-actions">
                <Button variant="ghost" onClick={() => openEditModal(product)}>
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm({ open: true, product })}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="demo-empty-state">
            <p>{t('demo.noProductsFound')}</p>
          </div>
        )}
      </Card>

      <ProductModal
        key={isModalOpen ? editingProduct?.id || 'new' : 'closed'}
        open={isModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title={t('common.deleteProduct')}
        message={`${t('messages.confirmDelete')} "${deleteConfirm.product?.name}"?`}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() =>
          deleteConfirm.product && handleDelete(deleteConfirm.product)
        }
        onCancel={() => setDeleteConfirm({ open: false, product: null })}
      />
    </div>
  );
}

function ProductModal({
  open,
  product,
  categories,
  onClose,
  onSave,
}: {
  open: boolean;
  product: DemoProduct | null;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (product: DemoProduct) => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<DemoProduct>>(product || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && formData.name && formData.sku && formData.category) {
      onSave({
        id: product?.id || '',
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        costPrice: formData.costPrice || 0,
        sellingPrice: formData.sellingPrice || 0,
        stock: formData.stock || 0,
        minimumStock: formData.minimumStock || 0,
        unit: formData.unit || 'pcs',
        status: formData.status || 'ACTIVE',
      });
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product?.id ? t('common.editProduct') : t('common.addProduct')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('common.save')}</Button>
        </>
      }
    >
      <form className="demo-product-form" onSubmit={handleSubmit}>
        <label>
          {t('common.name')}
          <Input
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </label>
        <label>
          SKU
          <Input
            required
            value={formData.sku || ''}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </label>
        <label>
          {t('common.category')}
          <Select
            required
            value={formData.category || ''}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          {t('common.costPrice')}
          <Input
            type="number"
            value={formData.costPrice || ''}
            onChange={(e) =>
              setFormData({ ...formData, costPrice: Number(e.target.value) })
            }
          />
        </label>
        <label>
          {t('common.sellingPrice')}
          <Input
            type="number"
            value={formData.sellingPrice || ''}
            onChange={(e) =>
              setFormData({ ...formData, sellingPrice: Number(e.target.value) })
            }
          />
        </label>
        <label>
          {t('common.stock')}
          <Input
            type="number"
            value={formData.stock || ''}
            onChange={(e) =>
              setFormData({ ...formData, stock: Number(e.target.value) })
            }
          />
        </label>
        <label>
          {t('common.minimumStock')}
          <Input
            type="number"
            value={formData.minimumStock || ''}
            onChange={(e) =>
              setFormData({ ...formData, minimumStock: Number(e.target.value) })
            }
          />
        </label>
        <label>
          {t('common.unit')}
          <Input
            value={formData.unit || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </label>
        <label>
          {t('common.status')}
          <Select
            value={formData.status || 'ACTIVE'}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as 'ACTIVE' | 'INACTIVE',
              })
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </label>
      </form>
    </Modal>
  );
}
