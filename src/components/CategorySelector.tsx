import React, { useState, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { Categoria, Tag as TagType } from '../types/categories';

interface CategorySelectorProps {
  tipo: 'entrada' | 'saida';
  categoriaId?: string;
  tagIds?: string[];
  observacao?: string;
  onChange: (categoria: { categoriaId: string; tagIds?: string[]; observacao?: string } | undefined) => void;
  compact?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  tipo,
  categoriaId,
  tagIds = [],
  observacao,
  onChange,
  compact = false
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState(categoriaId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(tagIds || []);
  const [observacaoText, setObservacaoText] = useState(observacao || '');

  useEffect(() => {
    loadCategorias();
    if (selectedCategoriaId) {
      loadTags();
    }
  }, [tipo, selectedCategoriaId]);

  const loadCategorias = () => {
    const cats = categoryService.getCategorias(tipo);
    setCategorias(cats);
  };

  const loadTags = () => {
    const tgs = categoryService.getTags(selectedCategoriaId);
    setTags(tgs);
  };

  const handleCategoriaChange = (catId: string) => {
    setSelectedCategoriaId(catId);
    setSelectedTagIds([]); // Limpar tags ao trocar categoria
    if (catId) {
      const cat = categorias.find(c => c.id === catId);
      if (cat) {
        onChange({ categoriaId: catId, tagIds: [], observacao: observacaoText });
      }
    } else {
      onChange(undefined);
    }
  };

  const handleTagToggle = (tagId: string) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    setSelectedTagIds(newTagIds);
    if (selectedCategoriaId) {
      onChange({ categoriaId: selectedCategoriaId, tagIds: newTagIds, observacao: observacaoText });
    }
  };

  const handleObservacaoChange = (text: string) => {
    setObservacaoText(text);
    if (selectedCategoriaId) {
      onChange({ categoriaId: selectedCategoriaId, tagIds: selectedTagIds, observacao: text });
    }
  };

  const handleClear = () => {
    setSelectedCategoriaId('');
    setSelectedTagIds([]);
    setObservacaoText('');
    onChange(undefined);
  };

  const selectedCategoria = categorias.find(c => c.id === selectedCategoriaId);

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
            selectedCategoriaId
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}
        >
          <Tag className="w-3 h-3" />
          {selectedCategoria ? selectedCategoria.nome : 'Categoria'}
          {selectedTagIds.length > 0 && (
            <span className="bg-purple-200 text-purple-800 rounded-full px-1.5 text-[10px]">
              {selectedTagIds.length}
            </span>
          )}
        </button>

        {showSelector && (
          <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[280px] max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-900">Categoria e Tags</h4>
              <button
                onClick={() => setShowSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
                <select
                  value={selectedCategoriaId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              {selectedCategoriaId && tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.cor } : {}}
                      >
                        {tag.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Observação</label>
                <textarea
                  value={observacaoText}
                  onChange={(e) => handleObservacaoChange(e.target.value)}
                  placeholder="Observações opcionais..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              {selectedCategoriaId && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full px-2 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remover Categoria
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-purple-600" />
        <label className="text-xs font-medium text-gray-700">Categoria</label>
      </div>
      
      <select
        value={selectedCategoriaId}
        onChange={(e) => handleCategoriaChange(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Nenhuma categoria</option>
        {categorias.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.nome}</option>
        ))}
      </select>

      {selectedCategoriaId && tags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.cor } : {}}
              >
                {tag.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCategoriaId && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Observação</label>
          <textarea
            value={observacaoText}
            onChange={(e) => handleObservacaoChange(e.target.value)}
            placeholder="Observações opcionais..."
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
