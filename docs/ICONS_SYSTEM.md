# Sistema de Ícones SVG Inline Profissional

## 📋 Visão Geral

Este sistema substitui completamente os ícones carregados da internet por SVG inline, garantindo:
- ✅ **Zero falhas de carregamento** - todos os ícones estão embebidos no código
- ✅ **Performance otimizada** - um único SVG sprite renderizado uma vez
- ✅ **Controlo total via CSS** - cor, tamanho, animações
- ✅ **Tipagem TypeScript** - segurança de tipos para nomes de ícones
- ✅ **Acessibilidade** - suporte para aria-labels

## 🚀 Uso Básico

### 1. O IconSprite já está no App.tsx
```tsx
import { IconSprite } from './components/icons';

// No root do App
<IconSprite /> // Já adicionado automaticamente
```

### 2. Usar ícones em qualquer componente
```tsx
import { Icon } from './components/icons';

// Uso básico
<Icon name="check" />

// Com tamanho predefinido (xs, sm, md, lg, xl, 2xl, 3xl)
<Icon name="home" size="lg" />

// Com tamanho numérico (pixels)
<Icon name="star" size={32} />

// Com cor (herda currentColor por padrão)
<Icon name="heart" className="text-red-500" />

// Com animação
<Icon name="loading" animation="spin" />
<Icon name="bell" animation="pulse" />
<Icon name="arrow-down" animation="bounce" />

// Com rotação
<Icon name="chevron-right" rotate={90} /> // Vira para baixo

// Com evento de clique
<Icon name="x" onClick={() => handleClose()} className="cursor-pointer" />

// Com acessibilidade
<Icon name="warning" ariaLabel="Atenção: campo obrigatório" />
```

## 🎨 Componentes Variantes

### IconCircle - Ícone com fundo circular
```tsx
import { IconCircle } from './components/icons';

<IconCircle 
  name="check" 
  size="md"
  bgClassName="bg-green-100" 
  className="text-green-600"
  circleSize="lg"
/>
```

### IconBadge - Ícone com contador/notificação
```tsx
import { IconBadge } from './components/icons';

<IconBadge 
  name="bell" 
  count={5}
  badgeColor="bg-red-500"
/>

// Apenas ponto indicador
<IconBadge name="mail" showDot />
```

### IconButton - Botão com ícone
```tsx
import { IconButton } from './components/icons';

<IconButton name="edit" variant="default" onClick={handleEdit} />
<IconButton name="trash" variant="ghost" className="text-red-500" />
<IconButton name="plus" variant="primary" />
<IconButton name="settings" variant="outline" />
```

## 📦 Ícones Disponíveis

### Navegação
`arrow-left`, `arrow-right`, `arrow-up`, `arrow-down`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `menu`, `x`, `external-link`

### Ações
`check`, `check-circle`, `plus`, `minus`, `edit`, `trash`, `copy`, `download`, `upload`, `refresh`, `search`, `filter`, `save`

### Utilizador
`user`, `users`, `logout`, `login`, `settings`, `lock`, `unlock`, `shield`

### Conteúdo
`file`, `file-text`, `folder`, `image`, `clipboard`, `book`, `book-open`

### Educação
`graduation-cap`, `lightbulb`, `target`, `trophy`, `star`, `award`, `chart-bar`

### Interface
`home`, `grid`, `list`, `eye`, `eye-off`, `info`, `help-circle`, `alert-circle`, `alert-triangle`, `x-circle`

### Mídia
`play`, `pause`, `volume`, `volume-off`, `mic`

### Tempo
`clock`, `calendar`, `timer`

### Pagamento
`credit-card`, `wallet`, `bank`, `money`

### Comunicação
`mail`, `phone`, `whatsapp`, `send`, `bell`

### Médico/Saúde
`stethoscope`, `pill`, `heartbeat`, `hospital`, `first-aid`

### Status
`loading`, `verified`, `blocked`

### Misc
`sun`, `moon`, `link`, `tag`, `map-pin`, `globe`, `zap`, `sparkles`

## 🔄 Migração: Substituir SVGs Inline Existentes

### Antes (SVG inline repetido):
```tsx
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
</svg>
```

### Depois (Icon component):
```tsx
<Icon name="arrow-left" size="md" />
```

### Exemplos de Substituição Comuns:

| SVG Path | Icon Name |
|----------|-----------|
| `M10 19l-7-7m0 0l7-7m-7 7h18` | `arrow-left` |
| `M5 12h14M12 5l7 7-7 7` | `arrow-right` |
| `M20 6L9 17l-5-5` | `check` |
| `M6 18L18 6M6 6l12 12` | `x` |
| `M4 6h16M4 12h16M4 18h16` | `menu` |
| `M9 5l7 7-7 7` | `chevron-right` |
| `M17 16l4-4m0 0l-4-4m4 4H7...` | `logout` |

## 🎯 Tamanhos Predefinidos

| Size | Classe | Pixels |
|------|--------|--------|
| `xs` | `w-3 h-3` | 12px |
| `sm` | `w-4 h-4` | 16px |
| `md` | `w-5 h-5` | 20px |
| `lg` | `w-6 h-6` | 24px |
| `xl` | `w-8 h-8` | 32px |
| `2xl` | `w-10 h-10` | 40px |
| `3xl` | `w-12 h-12` | 48px |

## 🛠️ Adicionar Novos Ícones

1. Abrir `components/icons/IconSprite.tsx`
2. Adicionar novo `<symbol>` dentro do `<defs>`:
```tsx
<symbol id="icon-novo-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="..." />
</symbol>
```

3. Adicionar o nome ao array em `components/icons/icons.types.ts`:
```tsx
export const ICON_NAMES = [
  // ... outros ícones
  'novo-icone',
] as const;
```

4. O TypeScript automaticamente reconhecerá o novo ícone!

## 📁 Estrutura de Ficheiros

```
components/
└── icons/
    ├── index.ts          # Exportações centralizadas
    ├── Icon.tsx          # Componente principal + variantes
    ├── IconSprite.tsx    # Definições SVG symbol
    └── icons.types.ts    # Tipagem TypeScript
```
