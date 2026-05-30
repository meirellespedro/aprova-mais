$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$downloadsDir = Join-Path $workspaceRoot "downloads\\uerj"
$tmp2020Rar = Join-Path $workspaceRoot "tmp-uerj-2020-full.rar"
$tmp2020ExtractDir = Join-Path $workspaceRoot "tmp-uerj-2020-full"

New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null

function Save-RemotePdf {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$FileName
  )

  $outputPath = Join-Path $downloadsDir $FileName
  Write-Host "Baixando $FileName"
  & curl.exe -k -L --fail --silent --show-error $Url -o $outputPath
}

function Copy-LocalPdf {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$FileName
  )

  $sourcePath = Join-Path $workspaceRoot $Source
  $outputPath = Join-Path $downloadsDir $FileName

  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Arquivo de origem nao encontrado: $Source"
  }

  Write-Host "Copiando $FileName"
  Copy-Item -LiteralPath $sourcePath -Destination $outputPath -Force
}

$remoteFiles = @(
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_LPI.pdf"; FileName = "uerj-2016-discursiva-lingua-portuguesa-instrumental-redacao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Fisica.pdf"; FileName = "uerj-2016-discursiva-fisica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Historia.pdf"; FileName = "uerj-2016-discursiva-historia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Biologia.pdf"; FileName = "uerj-2016-discursiva-biologia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Geografia.pdf"; FileName = "uerj-2016-discursiva-geografia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_LP_LB.pdf"; FileName = "uerj-2016-discursiva-lingua-portuguesa-literatura-brasileira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Lingua_Estrangeira.pdf"; FileName = "uerj-2016-discursiva-lingua-estrangeira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Matematica.pdf"; FileName = "uerj-2016-discursiva-matematica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/prova/2016_ED_Quimica.pdf"; FileName = "uerj-2016-discursiva-quimica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_LPI.pdf"; FileName = "uerj-2016-discursiva-lingua-portuguesa-instrumental-redacao-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Fisica.pdf"; FileName = "uerj-2016-discursiva-fisica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Historia.pdf"; FileName = "uerj-2016-discursiva-historia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Biologia.pdf"; FileName = "uerj-2016-discursiva-biologia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Geografia.pdf"; FileName = "uerj-2016-discursiva-geografia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_LP_LB.pdf"; FileName = "uerj-2016-discursiva-lingua-portuguesa-literatura-brasileira-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Espanhol.pdf"; FileName = "uerj-2016-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Frances.pdf"; FileName = "uerj-2016-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Ingles.pdf"; FileName = "uerj-2016-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Matematica.pdf"; FileName = "uerj-2016-discursiva-matematica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2016/provas_e_gabaritos/ed/padrao_resposta/2016_ED_PR_Quimica.pdf"; FileName = "uerj-2016-discursiva-quimica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_LPI_Redacao.pdf"; FileName = "uerj-2017-discursiva-lingua-portuguesa-instrumental-redacao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Fisica.pdf"; FileName = "uerj-2017-discursiva-fisica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Historia.pdf"; FileName = "uerj-2017-discursiva-historia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Biologia.pdf"; FileName = "uerj-2017-discursiva-biologia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Geografia.pdf"; FileName = "uerj-2017-discursiva-geografia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_LP_LB.pdf"; FileName = "uerj-2017-discursiva-lingua-portuguesa-literatura-brasileira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Lingua_Estrangeira.pdf"; FileName = "uerj-2017-discursiva-lingua-estrangeira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Matematica.pdf"; FileName = "uerj-2017-discursiva-matematica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/provas/2017_ED_Quimica.pdf"; FileName = "uerj-2017-discursiva-quimica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_LPI_Redacao.pdf"; FileName = "uerj-2017-discursiva-lingua-portuguesa-instrumental-redacao-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Fisica.pdf"; FileName = "uerj-2017-discursiva-fisica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Historia.pdf"; FileName = "uerj-2017-discursiva-historia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Biologia.pdf"; FileName = "uerj-2017-discursiva-biologia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Geografia.pdf"; FileName = "uerj-2017-discursiva-geografia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_LP_LB.pdf"; FileName = "uerj-2017-discursiva-lingua-portuguesa-literatura-brasileira-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Espanhol.pdf"; FileName = "uerj-2017-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Frances.pdf"; FileName = "uerj-2017-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Ingles.pdf"; FileName = "uerj-2017-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Matematica.pdf"; FileName = "uerj-2017-discursiva-matematica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2017/provas_e_gabaritos/ed/padrao_resposta/2017_ED_PR_Quimica.pdf"; FileName = "uerj-2017-discursiva-quimica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Redacao.pdf"; FileName = "uerj-2018-discursiva-redacao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Fisica.pdf"; FileName = "uerj-2018-discursiva-fisica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Historia.pdf"; FileName = "uerj-2018-discursiva-historia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Biologia.pdf"; FileName = "uerj-2018-discursiva-biologia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Geografia.pdf"; FileName = "uerj-2018-discursiva-geografia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_LPL.pdf"; FileName = "uerj-2018-discursiva-lingua-portuguesa-literaturas.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Lingua_Estrangeira.pdf"; FileName = "uerj-2018-discursiva-lingua-estrangeira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Matematica.pdf"; FileName = "uerj-2018-discursiva-matematica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/provas/2018_ED_Quimica.pdf"; FileName = "uerj-2018-discursiva-quimica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Redacao.pdf"; FileName = "uerj-2018-discursiva-redacao-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Fisica.pdf"; FileName = "uerj-2018-discursiva-fisica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Historia.pdf"; FileName = "uerj-2018-discursiva-historia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Biologia.pdf"; FileName = "uerj-2018-discursiva-biologia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Geografia.pdf"; FileName = "uerj-2018-discursiva-geografia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_LPL.pdf"; FileName = "uerj-2018-discursiva-lingua-portuguesa-literaturas-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Espanhol.pdf"; FileName = "uerj-2018-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Frances.pdf"; FileName = "uerj-2018-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Ingles.pdf"; FileName = "uerj-2018-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Matematica.pdf"; FileName = "uerj-2018-discursiva-matematica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2018/provas_e_gabaritos/ed/padrao_resposta/2018_ED_PR_Quimica.pdf"; FileName = "uerj-2018-discursiva-quimica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_LPL.pdf"; FileName = "uerj-2019-discursiva-lingua-portuguesa-literaturas.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Lingua_Estrangeira.pdf"; FileName = "uerj-2019-discursiva-lingua-estrangeira.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Historia.pdf"; FileName = "uerj-2019-discursiva-historia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Geografia.pdf"; FileName = "uerj-2019-discursiva-geografia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Biologia.pdf"; FileName = "uerj-2019-discursiva-biologia.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Fisica.pdf"; FileName = "uerj-2019-discursiva-fisica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Matematica.pdf"; FileName = "uerj-2019-discursiva-matematica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Quimica.pdf"; FileName = "uerj-2019-discursiva-quimica.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/provas/2019_ED_Redacao.pdf"; FileName = "uerj-2019-discursiva-redacao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_LPL.pdf"; FileName = "uerj-2019-discursiva-lingua-portuguesa-literaturas-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Espanhol.pdf"; FileName = "uerj-2019-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Frances.pdf"; FileName = "uerj-2019-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Ingles.pdf"; FileName = "uerj-2019-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Historia.pdf"; FileName = "uerj-2019-discursiva-historia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Geografia.pdf"; FileName = "uerj-2019-discursiva-geografia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Biologia.pdf"; FileName = "uerj-2019-discursiva-biologia-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Fisica.pdf"; FileName = "uerj-2019-discursiva-fisica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Matematica.pdf"; FileName = "uerj-2019-discursiva-matematica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Quimica.pdf"; FileName = "uerj-2019-discursiva-quimica-padrao.pdf" }
  @{ Url = "https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2019/provas_e_gabaritos/ed/padrao_resposta/2019_ED_PR_Redacao.pdf"; FileName = "uerj-2019-discursiva-redacao-padrao.pdf" }
)

foreach ($file in $remoteFiles) {
  Save-RemotePdf -Url $file.Url -FileName $file.FileName
}

if (-not (Test-Path -LiteralPath $tmp2020Rar)) {
  throw "Pacote 2020 nao encontrado em tmp-uerj-2020-full.rar"
}

if (Test-Path -LiteralPath $tmp2020ExtractDir) {
  Remove-Item -LiteralPath $tmp2020ExtractDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tmp2020ExtractDir -Force | Out-Null
& tar.exe -xf $tmp2020Rar -C $tmp2020ExtractDir

$localFiles = @(
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Biologia.pdf"; FileName = "uerj-2020-discursiva-biologia.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Fisica.pdf"; FileName = "uerj-2020-discursiva-fisica.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Geografia.pdf"; FileName = "uerj-2020-discursiva-geografia.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Historia.pdf"; FileName = "uerj-2020-discursiva-historia.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Lingua_Estrangeira.pdf"; FileName = "uerj-2020-discursiva-lingua-estrangeira.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_LPL.pdf"; FileName = "uerj-2020-discursiva-lingua-portuguesa-literaturas.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Matematica.pdf"; FileName = "uerj-2020-discursiva-matematica.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Quimica.pdf"; FileName = "uerj-2020-discursiva-quimica.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_Redacao.pdf"; FileName = "uerj-2020-discursiva-redacao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Biologia.pdf"; FileName = "uerj-2020-discursiva-biologia-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Fisica.pdf"; FileName = "uerj-2020-discursiva-fisica-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Geografia.pdf"; FileName = "uerj-2020-discursiva-geografia-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Historia.pdf"; FileName = "uerj-2020-discursiva-historia-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Espanhol.pdf"; FileName = "uerj-2020-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Frances.pdf"; FileName = "uerj-2020-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Ingles.pdf"; FileName = "uerj-2020-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_LPL.pdf"; FileName = "uerj-2020-discursiva-lingua-portuguesa-literaturas-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Matematica.pdf"; FileName = "uerj-2020-discursiva-matematica-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Quimica.pdf"; FileName = "uerj-2020-discursiva-quimica-padrao.pdf" }
  @{ Source = "tmp-uerj-2020-full\\2020_ED_PR_Redacao.pdf"; FileName = "uerj-2020-discursiva-redacao-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Biologia.pdf"; FileName = "uerj-2024-discursiva-biologia.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Estrangeiras.pdf"; FileName = "uerj-2024-discursiva-lingua-estrangeira.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Fisica.pdf"; FileName = "uerj-2024-discursiva-fisica.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Geografia.pdf"; FileName = "uerj-2024-discursiva-geografia.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Historia.pdf"; FileName = "uerj-2024-discursiva-historia.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\LPL.pdf"; FileName = "uerj-2024-discursiva-lingua-portuguesa-literatura.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Matematica.pdf"; FileName = "uerj-2024-discursiva-matematica.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Quimica.pdf"; FileName = "uerj-2024-discursiva-quimica.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Provas - Exame Discursivo UERJ 2024\\Redacao.pdf"; FileName = "uerj-2024-discursiva-redacao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Biologia_1.pdf"; FileName = "uerj-2024-discursiva-biologia-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Espanhol.pdf"; FileName = "uerj-2024-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Fisica_1.pdf"; FileName = "uerj-2024-discursiva-fisica-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Frances.pdf"; FileName = "uerj-2024-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Geografia_1.pdf"; FileName = "uerj-2024-discursiva-geografia-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Historia_1.pdf"; FileName = "uerj-2024-discursiva-historia-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Ingles.pdf"; FileName = "uerj-2024-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\LPL_1.pdf"; FileName = "uerj-2024-discursiva-lingua-portuguesa-literatura-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Matematica_1.pdf"; FileName = "uerj-2024-discursiva-matematica-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\Quimica_1.pdf"; FileName = "uerj-2024-discursiva-quimica-padrao.pdf" }
  @{ Source = "tmp-uerj-2024-disc\\Gabaritos - Exame Discursivo UERJ 2024\\redacao_1.pdf"; FileName = "uerj-2024-discursiva-redacao-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-biologia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-biologia.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-fisica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-fisica.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-geografia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-geografia.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-historia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-historia.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-lingua-estrangeira-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-estrangeira.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-lingua-portuguesa-literatura-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-portuguesa-literatura.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-matematica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-matematica.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-quimica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-quimica.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\prova-redacao-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-redacao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-biologia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-biologia-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-espanhol-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-estrangeira-espanhol-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-fisica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-fisica-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-frances-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-estrangeira-frances-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-geografia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-geografia-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-historia-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-historia-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-ingles-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-estrangeira-ingles-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-lingua-portuguesa-literatura-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-lingua-portuguesa-literatura-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-matematica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-matematica-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\respostas-quimica-exame-discursivo-uerj-2025.pdf"; FileName = "uerj-2025-discursiva-quimica-padrao.pdf" }
  @{ Source = "tmp-uerj-2025\\provas-e-gabaritos-uerj-2025\\provas-e-gabaritos-exame-discursivo-uerj-2025\\redacao-padrao-resposta-uerj-exame-discursivo-2025.pdf"; FileName = "uerj-2025-discursiva-redacao-padrao.pdf" }
)

foreach ($file in $localFiles) {
  Copy-LocalPdf -Source $file.Source -FileName $file.FileName
}

Write-Host "Discursivas da UERJ sincronizadas com sucesso."
