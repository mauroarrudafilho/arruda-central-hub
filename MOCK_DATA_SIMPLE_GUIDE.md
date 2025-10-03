# Sistema Simples de Sinalização de Dados Mock

## 🎯 **Objetivo**
Sistema simples e elegante para sinalizar dados mock em todo o projeto, facilmente removível antes do deploy.

## ✅ **Componentes Criados**

### **1. MockDataBadge.tsx**
- **Badge simples** com ícone de alerta e texto "Dados Mock"
- **Automático**: Só aparece em desenvolvimento (`NODE_ENV !== 'production'`)
- **Visual**: Badge amarelo discreto

### **2. useMockData.ts**
- **Hook simples** para gerenciar indicadores
- **Função**: `shouldShowMockIndicator(isMock)` - retorna true se deve mostrar badge
- **Persistente**: Salva preferência no localStorage

### **3. MockDataWrapper.tsx**
- **Wrapper global** para qualquer componente
- **Posicionamento**: Badge no canto superior direito
- **Flexível**: Pode ser aplicado em qualquer lugar

## 🚀 **Como Usar**

### **Opção 1: Badge no Título (Recomendado)**
```jsx
<CardTitle className="flex items-center gap-2">
  Configurações de Segurança
  {shouldShowMockIndicator(true) && <MockDataBadge />}
</CardTitle>
```

### **Opção 2: Wrapper Global**
```jsx
<MockDataWrapper isMock={true}>
  <Card>
    <CardContent>
      {/* Conteúdo mock */}
    </CardContent>
  </Card>
</MockDataWrapper>
```

### **Opção 3: Badge em Campo Específico**
```jsx
<EditableField
  label="Campo Mock"
  value="valor simulado"
  isMock={true}  // Mostra badge automaticamente
/>
```

## 📋 **Aplicar em Todo o Projeto**

### **1. Dashboard**
```jsx
// Em src/pages/Dashboard.tsx
import { MockDataBadge } from '@/components/ui/MockDataBadge';
import { useMockData } from '@/hooks/useMockData';

// Para métricas mock:
<CardTitle>
  Métricas de Performance
  {shouldShowMockIndicator(true) && <MockDataBadge />}
</CardTitle>
```

### **2. Analytics**
```jsx
// Em src/pages/Analytics.tsx
// Para gráficos mock:
<CardTitle>
  Tendências Históricas
  {shouldShowMockIndicator(true) && <MockDataBadge />}
</CardTitle>
```

### **3. Hub**
```jsx
// Em src/pages/Hub.tsx
// Para módulos não implementados:
<Card className="relative">
  <CardHeader>
    <CardTitle>
      Módulo Não Implementado
      {shouldShowMockIndicator(true) && <MockDataBadge />}
    </CardTitle>
  </CardHeader>
</Card>
```

### **4. Qualquer Página**
```jsx
// Importar o hook
import { useMockData } from '@/hooks/useMockData';

// Usar no componente
const { shouldShowMockIndicator } = useMockData();

// Aplicar onde necessário
{shouldShowMockIndicator(true) && <MockDataBadge />}
```

## 🎨 **Visual**

### **Badge Mock**
- 🟡 **Cor**: Amarelo discreto
- ⚠️ **Ícone**: Triângulo de alerta
- 📝 **Texto**: "Dados Mock"
- 📱 **Responsivo**: Pequeno e não intrusivo

### **Comportamento**
- ✅ **Desenvolvimento**: Badge visível
- ❌ **Produção**: Badge automaticamente oculto
- 🔄 **Toggle**: Pode ser desabilitado via localStorage

## 🚀 **Remoção Antes do Deploy**

### **Automático**
- Badges **não aparecem** em produção (`NODE_ENV === 'production'`)
- **Zero configuração** necessária

### **Manual (Opcional)**
```bash
# Buscar e remover todos os badges mock
grep -r "MockDataBadge" src/ --include="*.tsx" --include="*.ts"
grep -r "shouldShowMockIndicator" src/ --include="*.tsx" --include="*.ts"
```

## 📊 **Status Atual**

- ✅ **Sistema Base**: Implementado
- ✅ **UserDetail**: Aplicado
- ⏳ **Dashboard**: Pendente
- ⏳ **Analytics**: Pendente
- ⏳ **Hub**: Pendente
- ⏳ **Outras Páginas**: Pendente

## 🎯 **Próximos Passos**

1. **Aplicar em Dashboard**: Identificar métricas mock
2. **Aplicar em Analytics**: Identificar gráficos simulados
3. **Aplicar em Hub**: Identificar módulos não implementados
4. **Aplicar em outras páginas**: Conforme necessário

---

**Resultado**: Sistema simples, elegante e facilmente removível que sinaliza dados mock em todo o projeto! 🚀


