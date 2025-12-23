import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Folder, Save, XCircle } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { Categoria, Tag as TagType } from '../types/categories';
import * as Icons from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState<'entrada' | 'saida' | 'ambos' | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, filterTipo]);

  const loadData = () => {
    const cats = categoryService.getCategorias(filterTipo === 'all' ? undefined : filterTipo);
    const tgs = categoryService.getTags();
    setCategorias(cats);
    setTags(tgs);
  };

  const handleSaveCategoria = () => {
    if (!editingCategoria) return;
    
    if (!editingCategoria.nome.trim()) {
      alert('Nome da categoria é obrigatório');
      return;
    }

    categoryService.saveCategoria(editingCategoria);
    loadData();
    setEditingCategoria(null);
    setShowCategoriaForm(false);
  };

  const handleSaveTag = () => {
    if (!editingTag) return;
    
    if (!editingTag.nome.trim()) {
      alert('Nome da tag é obrigatório');
      return;
    }

    categoryService.saveTag(editingTag);
    loadData();
    setEditingTag(null);
    setShowTagForm(false);
  };

  const handleDeleteCategoria = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      categoryService.deleteCategoria(id);
      loadData();
    }
  };

  const handleDeleteTag = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tag?')) {
      categoryService.deleteTag(id);
      loadData();
    }
  };

  const handleNewCategoria = () => {
    setEditingCategoria({
      id: `cat_${Date.now()}`,
      nome: '',
      tipo: 'ambos',
      cor: categoryService.getCorAleatoria(),
      ativa: true,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    });
    setShowCategoriaForm(true);
  };

  const handleNewTag = () => {
    setEditingTag({
      id: `tag_${Date.now()}`,
      nome: '',
      cor: categoryService.getCorAleatoria(),
      ativa: true,
      dataCriacao: new Date().toISOString()
    });
    setShowTagForm(true);
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Folder;
    const Icon = (Icons as any)[iconName];
    return Icon || Folder;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestão de Categorias e Tags</h2>
            <p className="text-sm text-gray-600 mt-1">Organize suas movimentações financeiras</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTipo('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTipo === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterTipo('entrada')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTipo === 'entrada' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterTipo('saida')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTipo === 'saida' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setFilterTipo('ambos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTipo === 'ambos' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ambos
            </button>
          </div>

          {/* Categorias */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Categorias ({categorias.length})
              </h3>
              <button
                onClick={handleNewCategoria}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>

            {showCategoriaForm && editingCategoria && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editingCategoria.nome}
                      onChange={(e) => setEditingCategoria({ ...editingCategoria, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Vendas, Fornecedores..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={editingCategoria.tipo}
                      onChange={(e) => setEditingCategoria({ ...editingCategoria, tipo: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input
                      type="color"
                      value={editingCategoria.cor}
                      onChange={(e) => setEditingCategoria({ ...editingCategoria, cor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCategoria}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setShowCategoriaForm(false);
                        setEditingCategoria(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.map((cat) => {
                const IconComponent = getIconComponent(cat.icone);
                return (
                  <div
                    key={cat.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cat.cor + '20', color: cat.cor }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{cat.nome}</h4>
                          <p className="text-xs text-gray-500 capitalize">{cat.tipo}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCategoria(cat);
                            setShowCategoriaForm(true);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoria(cat.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {cat.descricao && (
                      <p className="text-xs text-gray-600 mt-2">{cat.descricao}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags ({tags.length})
              </h3>
              <button
                onClick={handleNewTag}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova Tag
              </button>
            </div>

            {showTagForm && editingTag && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editingTag.nome}
                      onChange={(e) => setEditingTag({ ...editingTag, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Urgente, Importante..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input
                      type="color"
                      value={editingTag.cor}
                      onChange={(e) => setEditingTag({ ...editingTag, cor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTag}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setShowTagForm(false);
                        setEditingTag(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: tag.cor, borderLeftWidth: '4px' }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.cor }}
                  />
                  <span className="text-sm font-medium text-gray-900">{tag.nome}</span>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => {
                        setEditingTag(tag);
                        setShowTagForm(true);
                      }}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
