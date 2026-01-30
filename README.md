# 🎮 NEON TERMO

> Um jogo de palavras estilo **Wordle / Termo**, desenvolvido em **HTML, CSS e JavaScript puro**, com estética **neon futurista**, múltiplos modos de jogo e suporte completo ao português brasileiro 🇧🇷

✨ Rápido • Offline • Responsivo • Sem dependências

---

## 🚀 Demo

Abra o arquivo `index.html` em qualquer navegador moderno.

- ✔️ Não precisa servidor
- ✔️ Funciona 100% offline

---

## 🧠 Sobre o Projeto

**Neon Termo** é uma implementação completa e polida de um jogo de adivinhação de palavras, focada em:

- Arquitetura limpa
- Experiência do usuário
- Estética premium
- Código moderno e organizado

Inspirado em **Wordle / Termo**, mas com **modos múltiplos**, **temas visuais** e **recursos avançados**.

---

## 🎯 Modos de Jogo

| Modo     | Palavras | Tentativas | Dificuldade |
|----------|----------|------------|-------------|
| TERMO    | 1        | 6          | Fácil       |
| DUETTO   | 2        | 7          | Médio       |
| QUARTETO | 4        | 9          | Difícil     |

- Tentativas compartilhadas
- Feedback independente por tabuleiro

---

## 🎨 Temas Visuais

- 🌌 **Neon (padrão)** – Cyberpunk futurista
- 🌿 **Nature** – Tons naturais
- 🌅 **Retro / Sunset** – Estilo anos 80

- Troca de tema em tempo real
- Tema salvo no `localStorage`

---

## 🟩 Mecânica de Feedback

- 🟩 Verde → letra correta na posição correta  
- 🟨 Amarelo → letra existe em outra posição  
- ⬛ Cinza → letra não existe na palavra  

Funciona no grid e no teclado virtual.

---

## ✨ Recursos Avançados

- Normalização automática de acentos (`MUSICA` → `MÚSICA`)
- Teclado virtual interativo
- Navegação com setas
- Validação de palavras reais
- Sistema de estatísticas por modo
- Persistência com LocalStorage
- Bloqueio de palavras repetidas
- Prioridade correta no teclado (verde > amarelo > cinza)

---

## 📱 Responsividade

- Desktop: Quarteto em 4 colunas
- Tablet: Layout 2x2
- Mobile: Layout compacto com escala automática

---

## 🧱 Estrutura do Projeto

```
Termo/
├── index.html
├── style.css
├── script.js
├── words.js
├── filter_words.py
├── br-utf8.txt
├── palavras.csv
└── Cinco2
```

## 🧠 Arquitetura
**GameController**

- Gerencia o estado global

- Coordena múltiplos tabuleiros

- Controla entrada do usuário

- Estatísticas, temas e modais

**TermoBoard

- Gerencia um tabuleiro individual

- Valida tentativas

- Calcula feedback das letras

- Detecta vitória/derrota

**Fluxo de dados:**

```Entrada do Usuário
        ↓
GameController
        ↓
Validação
        ↓
TermoBoard(s)
        ↓
Feedback Visual
        ↓
Atualização de Estado
```
---


## 🛠️ Tecnologias

**Frontend**

- HTML5

- CSS3 (Grid, Flexbox, Variáveis CSS)

- JavaScript ES6+

**Extras**

- LocalStorage API

- Unicode Normalization

- Regex

- Python 3 (processamento de palavras)
---


##🔧 Script de Palavras (filter_words.py)

Processa dicionários em português e gera listas de palavras válidas com 5 letras.

```python filter_words.py br-utf8.txt palavras.csv```


- UTF-8

- Regex

- Normalização

- Saída pronta para JavaScript
---

## 🌟 Diferenciais

- Estética neon premium

- Português brasileiro real

- Sem frameworks

- Zero dependências

- Código limpo e modular

- Totalmente responsivo

- Persistência local

- Múltiplos modos reais
---
## 📈 Melhorias Futuras

- Sistema de conquistas

- Palavra do dia

- Multiplayer

- Sons

- Compartilhamento de resultados

- Internacionalização

- Modo hard
---

## 📄 Licença

Projeto educacional/pessoal, livre para estudo e aprendizado.
---

## ❤️ Desenvolvido com café, neon e obsessão por detalhes.


---
