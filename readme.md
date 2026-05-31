<h1 align="center">📚 Aprova+</h1>

<p align="center">
  Plataforma de estudos para <b>ENEM e UERJ</b> com <b>correção de redação por IA</b>,
  planner, simulados e acompanhamento de progresso — tudo no navegador, sem cadastro.
</p>

<p align="center">
  <a href="https://aprova-mais.pages.dev/">🔗 Acessar a plataforma</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white">
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white">
  <img src="https://img.shields.io/badge/Cloudflare%20Pages-F38020?style=flat&logo=cloudflare&logoColor=white">
</p>

---

## 📖 Sobre o projeto

O **Aprova+** é uma aplicação web (PWA) que ajuda estudantes a se prepararem para o ENEM e o vestibular da UERJ. O grande diferencial é a **correção de redação por inteligência artificial**: o aluno escreve o texto e recebe uma avaliação **competência por competência**, no padrão das bancas, com feedback do que melhorar.

A aplicação roda inteiramente no navegador, **sem necessidade de cadastro** — os dados do usuário ficam salvos localmente no próprio dispositivo.

## ✨ Funcionalidades

- 📝 **Correção de redação por IA** — avaliação competência a competência (padrão ENEM/UERJ) via API do Google Gemini
- 🗓️ **Planner semanal** — organização dos estudos por dia
- ⏱️ **Timer Pomodoro** — foco em ciclos de estudo
- 📊 **Acompanhamento de progresso** — visão do que já foi estudado
- 🧪 **Simulados** — prática de questões
- 📱 **PWA** — instalável no celular e funciona como app
- 🔒 **Sem cadastro** — dados salvos localmente no navegador

## 🧠 Como funciona a correção por IA

A chave da API do Gemini **nunca fica exposta no front-end**. As requisições passam por uma **função serverless** (Cloudflare Pages Functions), que:

1. Recebe o texto da redação enviado pelo navegador;
2. Monta o prompt com os critérios de avaliação (as competências);
3. Chama a API do Gemini de forma segura, com a chave protegida no servidor;
4. Retorna ao aluno uma **resposta estruturada** com a nota e o feedback de cada competência.

Esse desenho garante **segurança da chave** e uma saída padronizada para a interface.

## 🛠️ Tecnologias

- **Front-end:** HTML5, CSS3, JavaScript
- **IA:** API do Google Gemini + Prompt Engineering (saída estruturada)
- **Back-end:** Função serverless (Cloudflare Pages Functions)
- **Persistência:** Armazenamento local do navegador (localStorage)
- **PWA:** Service Worker + Web App Manifest
- **Deploy:** Cloudflare Pages

## 🚀 Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/meirellespedro/aprova-mais.git
cd aprova-mais

# 2. Abra o index.html no navegador
#    (ou use uma extensão de servidor local, como o Live Server do VS Code)
```

> ⚠️ A correção por IA depende da função serverless e de uma chave da API do Gemini
> configurada como variável de ambiente no ambiente de deploy (ex.: `GEMINI_API_KEY`).
> Localmente, as demais funcionalidades (planner, Pomodoro, simulados) funcionam normalmente.

## 📷 Screenshots

> _Adicione aqui um print da tela principal e da correção de redação._
> _Dica: salve as imagens numa pasta `/screenshots` e referencie com `![Descrição](screenshots/arquivo.png)`._

## 👤 Autor

**Pedro Meirelles** — Desenvolvedor Full-Stack

[Portfólio](https://meirellespedro.github.io/portfoliomeirelles/) · [LinkedIn](https://www.linkedin.com/in/pedromei2019) · [GitHub](https://github.com/meirellespedro)
