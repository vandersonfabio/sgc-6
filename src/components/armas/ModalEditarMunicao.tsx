import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { EstoqueLote } from '../../types/database';
import { X, Layers, CheckCircle2, AlertTriangle, Package, Shield } from 'lucide-react';

interface ModalEditarMunicaoProps {
  municao?: EstoqueLote | null;
  /** When true, forces the modal to edit as a non-serialized general item without calibre */
  isGeneralMaterial?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarMunicao: React.FC<ModalEditarMunicaoProps> = ({
  municao,
  isGeneralMaterial = false,
  onClose,
  onSuccess,
}) => {
  const { db } = useDatabase();

  const isEditing = Boolean(municao);

  // Determine if this item is genuinely a munition or general non-serialized item
  const isItemMunicao =
    !isGeneralMaterial &&
    Boolean(
      municao?.calibre ||
        municao?.id_tipo_material === 8 ||
        (!municao && !isGeneralMaterial)
    );

  const [tipoItem, setTipoItem] = useState(municao?.tipo_item || (isItemMunicao ? 'Munição' : ''));
  const [calibre, setCalibre] = useState(municao?.calibre || '9mm');
  const [marca, setMarca] = useState(municao?.marca || (isItemMunicao ? 'CBC' : ''));
  const [modelo, setModelo] = useState(municao?.modelo || '');
  const [quantidade, setQuantidade] = useState<number>(municao ? municao.quantidade_atual : 100);
  const [observacao, setObservacao] = useState(municao?.observacao || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isItemMunicao && !calibre.trim()) {
      setErrorMessage('Informe o calibre da munição.');
      return;
    }

    if (!isItemMunicao && !tipoItem.trim()) {
      setErrorMessage('Informe o nome / descrição do material.');
      return;
    }

    if (quantidade < 0) {
      setErrorMessage('A quantidade em estoque não pode ser negativa.');
      return;
    }

    if (isEditing && municao) {
      const res = db.atualizarLote(municao.id_lote, {
        tipo_item: isItemMunicao ? 'Munição' : tipoItem.trim(),
        calibre: isItemMunicao ? calibre.trim() : null,
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        quantidade_atual: quantidade,
        observacao: observacao.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Erro ao atualizar dados do item.');
      }
    } else {
      const res = db.cadastrarLote({
        modulo: 'Armas',
        id_tipo_material: isItemMunicao ? 8 : (municao?.id_tipo_material || null),
        tipo_item: isItemMunicao ? 'Munição' : tipoItem.trim(),
        calibre: isItemMunicao ? calibre.trim() : null,
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        quantidade_atual: quantidade,
        observacao: observacao.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Erro ao cadastrar estoque.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isItemMunicao
              ? 'bg-amber-50 border-amber-100'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl text-white shadow-xs ${
                isItemMunicao ? 'bg-amber-600' : 'bg-blue-600'
              }`}
            >
              {isItemMunicao ? <Layers className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing
                  ? isItemMunicao
                    ? `Editar Estoque de Munição (${municao?.calibre})`
                    : `Editar Material Não Serializado (${municao?.tipo_item})`
                  : isItemMunicao
                  ? 'Cadastrar Novo Estoque de Munição'
                  : 'Cadastrar Novo Material Não Serializado'}
              </h2>
              <p className="text-xs text-slate-500">
                6º BPM • Reserva de Armamento e Material Bélico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isItemMunicao ? (
            /* Campos específicos para munições */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Calibre <span className="text-amber-600">*</span>
                </label>
                <select
                  value={calibre ?? '9mm'}
                  onChange={(e) => setCalibre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-600"
                >
                  <option value="9mm">9mm (9x19mm Parabellum)</option>
                  <option value=".40 S&W">.40 S&W (Smith & Wesson)</option>
                  <option value="5.56x45mm">5.56x45mm NATO</option>
                  <option value="7.62x51mm">7.62x51mm NATO</option>
                  <option value="12 GA">12 GA (Calibre 12)</option>
                  <option value=".38 SPL">.38 SPL (Special)</option>
                  <option value=".380 ACP">.380 ACP</option>
                  <option value=".50 BMG">.50 BMG</option>
                  <option value="Outro">Outro Calibre</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Fabricante / Marca <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CBC, Federal, Magtech"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          ) : (
            /* Campos para outros materiais não serializados (Algemas, Bastões, etc) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Nome / Descrição do Material <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Algemas Plásticas descartáveis, Bastão Tonfa..."
                  value={tipoItem}
                  onChange={(e) => setTipoItem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Fabricante / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Condor, Algemas Brasil, Poly Defensor"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                {isItemMunicao ? 'Especificação / Projétil' : 'Modelo / Especificação'}
              </label>
              <input
                type="text"
                placeholder={isItemMunicao ? 'Ex: ETOG 124gr Bonded, SS109' : 'Ex: Lacre Duplo, Tático'}
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Saldo Físico em Estoque (Unidades) <span className="text-amber-600">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-black text-amber-700 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Observações / Destinação Operacional
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Carga para serviço operacional diário, reserva técnica, kit de contenção..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`inline-flex items-center space-x-2 px-5 py-2 rounded-lg text-white text-xs font-bold shadow-xs transition ${
                isItemMunicao
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
