# Node.js Hello World API

Esse repositório visa conter os arquivos necessários para deployar uma aplicação utilizando GitHub Actions em um cluster local (Minikube), assim como monitorá-la através do Prometheus, Loki e Grafana.

## Requisitos

- Instalar e executar o Docker ([Documentação de apoio](https://docs.docker.com/engine/install/)).

- Instalar o Minikube ([Documentação de apoio](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Fx86-64%2Fstable%2Fbinary+download)).

- Instalar o Kubectl ([Documentação de apoio](https://kubernetes.io/docs/tasks/tools/)).

- Instalar o ngrok ([Documentação de apoio](https://download.ngrok.com/downloads)).

- Instalar o helm ([Documentação de apoio](https://helm.sh/docs/intro/install/)).

## Preparando o ambiente

1. Inicie o minikube:
```sh
minikube start
```

2. Habilite o addon de métricas do Kubernetes:
```sh
minikube addons enable metrics-server
```

3. Crie uma ServiceAccount no Kubernetes que será usada para autenticar no cluster e realizar o deploy:
```sh
kubectl create serviceaccount ci-deployer
```

4. Crie uma role para a ServiceAccount com as permissões necessárias:
   - Aplique o arquivo disponível em ./k8s_config/serviceaccount_role.yml no Kubernetes:
   ```sh
   kubectl apply -f ./k8s_config/serviceaccount_role.yml
   ```

5. Atrele a role a ServiceAccount criada:
```sh
kubectl create rolebinding deployer-binding --role=deployment-manager --serviceaccount=default:ci-deployer
```

6. Crie um token para a ServiceAccount:
```sh
kubectl create token ci-deployer
```

7. Salve o token na variável **KUBERNETES_TOKEN** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Isso é necessário para que o workflow do GitHub Actions consiga recuperar o valor do token e realizar o deploy da aplicação. As demais variáveis não precisam ser alteradas por hora.

8. Crie um túnel de conexão entre sua máquina local e o cluster Kubernetes (isso é necessário para poder expor os serviços e acessá-los pelo IP de sua máquina local):
```sh
sudo minikube tunnel
```

9. Habilite um proxy que exponha o cluster na porta **8080** e aceite requisições da internet (necessário para que o workflow do GitHut Actions consiga fazer requisições de deploy para o cluster):
```sh
kubectl proxy --address='0.0.0.0' --accept-hosts='^*$' --port=8080
``` 

10. Configure o ngrok da seguinte forma (o token a seguir foi criado especificamente para esse teste):
```sh
ngrok authtoken 2sQD8N7D1tOyRL4D24tBonlhy8T_5URgkABUrGxuHhMZLJFPQ
```

11. Exponha a porta **8080** (a qual se refere a porta que o cluster Kubernetes foi exposto localmente anteriormente) para a internet usando o ngrok:
```sh
ngrok http 8080
```

12. Copie a URL pública exibida no campo **Forwarding** e salve na variável **KUBERNETES_URL** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Essa URL será usada para disparar o deploy através do GitHub Actions.

13. Instale o Prometheus e o Grafana com o helm:
```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack
```

14. Instale o Loki com o helm:
```sh
helm repo add grafana https://grafana.github.io/helm-charts

helm repo update

helm upgrade --install loki grafana/loki-stack
```

15. Faça um redirecionamento de portas para poder acessar os serviços localmente:
```sh
kubectl port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090

kubectl port-forward svc/monitoring-grafana 3001:80

kubectl port-forward svc/loki 3100:3100
```

16. Adicione o Loki como uma fonte de dados no Grafana:
   - Para acessar o Grafana, acesse a url **http://localhost:3001** e logue com as credenciais **admin** (usuário) e **prom-operator** (senha).
   - Vá em **Connections -> Data sources -> Add new data source -> Loki**.
   - Insira no campo **URL** o valor **http://loki:3100** e clique em **Save & test** (é possível que apresente um erro no teste, mas a fonte de dados já foi adicionada e pode ser consumida sem problemas).

17. Crie o dashboard de monitoramento no Grafana:
   - Acesse **Dashboards -> New -> Import -> Upload dashboard JSON file** e selecione o arquivo presente em ./grafana_config/dashboard.json.
   - Selecione o Data Source do Prometheus e do Loki.
   - Clique em **Import** (Por hora não haverá dados pois não fizemos o deploy da aplicação).
18. Crie os alertas no Grafana:
   - Acesse **Alerting -> Alert rules -> New alert rule**.
   - **Uso de memória**
      - Passo 1
         -   Defina um nome (Ex: Memory usage > 80%)
      - Passo 2
         - No campo de query, selecione a query do tipo **code** e insira: **(sum by(pod) (container_memory_usage_bytes{pod=~"api-node.*"}) * 100) / sum by(pod) (kube_pod_container_resource_limits{resource="memory"})**
         - Modifique na Expression **C** o valor de 0 para 80 no campo **IS ABOVE**
      - Passo 3
         - Clique em **New folder** e crie uma pasta chamada api-node-alerts
         - Clique em **New evaluation group, nomeie api-node-interval e mantenha o intervalo padrão
      - Passo 4
         - Selecione o Contact point padrão criado pelo Grafana
      - Salve
   - **Uso de CPU**
      - Passo 1
         -   Defina um nome (Ex: CPU usage > 80%)
      - Passo 2
         - No campo de query, selecione a query do tipo **code** e insira: **(sum by(pod) (rate(container_cpu_usage_seconds_total{pod=~"api-node.*"}[5m])) * 100) / sum by(pod) (kube_pod_container_resource_limits{resource="cpu"})**
         - Modifique na Expression **C** o valor de 0 para 80 no campo **IS ABOVE**
      - Passo 3
         - Selecione a pasta criada
         - Selecione o evalutation group criado
      - Passo 4
         - Selecione o Contact point padrão criado pelo Grafana
      - Salve
   - **Quantidade de répicas**
      - Passo 1
         -   Defina um nome (Ex: Number of replicas < 2)
      - Passo 2
         - No campo de query, selecione a query do tipo **code** e insira: **count(kube_pod_container_info{pod=~"api-node.*"})**
         - Modifique na Expression **C** o valor de 0 para 2 e troque de **IS ABOVE** por **IS BELOW**
      - Passo 3
         - Selecione a pasta criada
         - Selecione o evalutation group criado
      - Passo 4
         - Selecione o Contact point padrão criado pelo Grafana
      - Salve

19. Faça o Deploy da aplicação fazendo um push para a branch **main**.

## CI/CD
A esteira de CI/CD foi construída em cima da ferramenta de **Workflow do GitHub Actions**. As configurações do Workflow estão armazenadas no arquivo **./.github/workflows/deploy.yml**.

### Steps

1. Configuring Git
   - Definição das configurações user.name e user.email do Git. Isso é necessário para que o npm consiga commitar e fazer push para o GitHub dos arquivos JSON contendo as mudanças de versão.

2. Get the source branch name
   - Recupera o nome da branch a qual foi mergeada para a **main** e ocasionou o deploy. Isso é feito fazendo uma requisição para API do GitHub buscando a branch de origem dentre os Pull Requests fechados que contenham o hash de commit que disparou o workflow.

3. Get release type
   - Baseado no nome da source branch recuperado anteriormente, defini o tipo de release para poder realizar o bump da versão posteriormente.
      - Se o nome da branch iniciar com **release/**, o tipo de release será **major**.
      - Se o nome da branch iniciar com **feature/**, o tipo de release será **minor**.
      - Se o nome da branch iniciar com **hotfix/**, o tipo de release será **patch**.
      - Caso não se enquadre em nenhuma das regras acima, o tipo de release também será **patch**.
4. Bump version
   - Realiza e commita no GitHub o bump da versão utilizando o comando **npm version**. Foi criado um token no GitHub para poder realizar esta ação.
5. Docker Build
   - É feito o build da imagem Docker da aplicação.
6. Docker Push
   - O push é feito para um repositório no Docker Hub. Foram criados Environment Secrets no repositório para armazenar os dados de autenticação no Docker Hub. A imagem é taggeada e enviada para o Docker Hub de acordo com a versão retornada pelo bump feito anteriormente.
7. Release
   - Uma action externa é usada para criar uma Tag e Release no Github da versão que está sendo deployada.
8. Set up Kubectl
   - Uma action externa é usada para instalar e configurar o kubectl na runner que está executando o Workflow.
9. Set up deployment file
   - O arquivo **./deploy/deployment.yml** que contém o que será deployado no Kubernetes é modificado para que seja preenchido dinâmicamente o valor da propriedade **image** com a imagem e tag correta que foi enviada para o Docker Hub.
10. Deploy
   - É feito o deploy utilizando o kubectl e referenciando o servidor Kubernetes que está rodando localmente.

Todos os tokens, secrets, e demais variáveis relevantes que não devem ficar expostas no código foram armazenadas em um **Environment secrets** chamado **Production**. Assim o arquivo do workflow pode usá-las durante o deploy sem expor informações sensíveis.

## Kubernetes

### Ambiente

O Minikube foi a solução escolhida para executar um cluster Kubernetes localmente. Sua configuração padrão foi mantida, exceto pela habilitação do addon **metrics-server** e habilitação de um **tunnel** para permitir a comunicação entre os serviços das aplicações e a máquina local.

Para possibilitar que a comunicação entre o GitHub Actions e o cluster Kubernetes existisse, foi criado uma ServiceAccount e uma role com permissões específicas para o deploy, assim como um token para tal. O arquivo de configuração da role está disponível em **./k8s_config/serviceaccount_role.yml**.

Além disso, o comando **kubectl proxy** foi usado para expor e aceitar requisições vindas da internet para o cluster para que o GitHub Actions conseguisse disparar o deploy. Também foi usado o comando **kubectl port-forward** para redirecionar as portas dos serviços do Prometheus, Grafana e Loki para portas locais da máquina que está estiver o cluster.

### Aplicação

O arquivo da aplicação deployada contendo os manifestos do Kubernetes contém quatro tipos de componentes: **Deployment**, **Service**, **ConfigMap** e **HorizontalPodAutoscaler**.

- **Deployment**
   - Componente principal da aplicação contendo especificações de 2 réplicas iniciais. Cada réplica contém os seguintes recursos:
      - 20m e 35m de requests e limits de CPU respectivamente.
      - 256Mi e 1024Mi de requests e limits de memória respectivamente
   - Além disso, há a configuração de uma variável de ambiente que referencia um valor configurado no ConfigMap da aplicação.
- **Service**
   - Service do tipo LoadBalancer usado para fazer as requisições para a aplicação.
- **ConfigMap**
   - Usado para armazenar o valor da porta de execução de API internamente no pod apenas para exemplificar um caso de uso do ConfigMap.
- **HorizontalPodAutoscaler**
   - Configuração do HPA para escalar a aplicação até 10 réplicas, mantendo o mínimo de 2, caso o uso de CPU no pod ultrapasse 70%.

*Para fins de exemplificação de logs, foram adicionados logs para cada requisição feita para as duas rotas já existentes da API*

## Observabilidade
Para a implementação da observabilidade, foi optado pelo uso do Grafana (criação dos dashboards e alertas), Prometheus (envio de métricas de infraestrutura) e Loki (envio de métricas de logs).

Foi utilizado as stacks do Prometheus, Grafana e Loki já disponíveis para o **helm**.

- Dashboards
   - Uso de memória
      - Métrica histórica di uso de memória
      - Métrica atual do uso de memória
   - Uso de CPU
      - Métrica histórica do uso de CPU
      - Métrica atual do uso de CPU
   - Número de réplicas
      - Métrica histórica do número de réplicas
      - Métrica atual do número de réplicas
   - Logs
      - Logs de inicialização da aplicação
      - Logs de requisição para as rotas existentes

O Dashboard possue filtros por Pod, podendo exibir métricas de pods específicos, ou de todos eles.

- Alertas
   - Uso de memória > 80% (baseado nos limits)
   - Uso de CPU > 80% (baseado nos limits)
   - Quantidade de réplicas < 2