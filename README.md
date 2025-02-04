# Node.js Hello World API

Esse repositório visa conter os arquivos necessários para deployar uma aplicação utilizando GitHub Actions em um cluster local (Minikube), assim como monitorá-la através do Prometheus, Loki e Grafana.

## Requisitos

- Instalar e executar o Docker ([Documentação de apoio](https://docs.docker.com/engine/install/))

- Instalar o Minikube ([Documentação de apoio](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Fx86-64%2Fstable%2Fbinary+download))

- Instalar o Kubectl ([Documentação de apoio](https://kubernetes.io/docs/tasks/tools/))

- Instalar o ngrok ([Documentação de apoio](https://download.ngrok.com/downloads))

- Instalar o helm ([Documentação de apoio](https://helm.sh/docs/intro/install/))

## Preparando o ambiente

1. Inicie o minikube:
```sh
minikube start
```

2. Habilite o addon de métricas do Kubernetes
```sh
minikube addons enable metrics-server
```

3. Crie uma ServiceAccount no Kubernetes que será usada para autenticar no cluster e realizar o deploy
```sh
kubectl create serviceaccount ci-deployer -n default
```

4. Crie uma role para a ServiceAccount com as permissões necessárias
   - Aplique o arquivo disponível em ./k8s_config/serviceaccount_role.yml no Kubernetes
   ```sh
   kubectl apply -f ./k8s_config/serviceaccount_role.yml
   ```

5. Atrele a role a ServiceAccount criada
```sh
kubectl create rolebinding deployer-binding --role=deployment-manager --serviceaccount=default:ci-deployer --namespace=default
```

6. Crie um token para a ServiceAccount
```sh
kubectl create token ci-deployer -n default
```

7. Salve o token na variável **KUBERNETES_TOKEN** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Isso é necessário para que o workflow do GitHub Actions consiga recuperar o valor do token e realizar o deploy da aplicação. As demais variáveis não precisam ser alteradas por hora.

8. Crie um túnel de conexão entre sua máquina local e o cluster Kubernetes (isso é necessário para poder expor os serviços e acessá-los pelo IP de sua máquina local)

```sh
sudo minikube tunnel
```

9. Habilite um proxy que exponha o cluster na porta **8080** para a internet (necessário para que o workflow do GitHut Actions consiga fazer requisições de deploy para o cluster)
```sh
kubectl proxy --address='0.0.0.0' --accept-hosts='^*$' --port=8080
``` 

10. Configure o ngrok da seguinte forma (o token a seguir foi criado especificamente para esse teste).
```sh
ngrok authtoken 2sQD8N7D1tOyRL4D24tBonlhy8T_5URgkABUrGxuHhMZLJFPQ
```

11. Exponha a porta **8080** (a qual se refere a porta que o cluster Kubernetes foi exposto localmente anteriormente) para a internet usando o ngrok
```sh
ngrok http 8080
```

12. Copie a URL pública exibida no campo **Forwarding** e salve na variável **KUBERNETES_URL** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Essa URL será usada para disparar o deploy através do GitHub Actions

13. Instale o Prometheus e o Grafana com o helm
```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack
```

14. Instale o Loki com o helm
```sh
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm upgrade --install loki grafana/loki-stack
```

15. Faça um redirecionamento de portas para poder acessar os serviços localmente
```sh
kubectl port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090
kubectl port-forward svc/monitoring-grafana 3001:80
kubectl port-forward svc/loki 3100:3100
```

16. Adicione o Loki como uma fonte de dados no Grafana

   - Para acessar o Grafana, acesse a url **http://localhost:3001** e logue com as credenciais **admin** (usuário) e **prom-operator** (senha)
   - Vá em **Connections -> Data sources -> Add new data source -> Loki**
   - Insira no campo **URL** o valor **http://loki:3100** e clique em **Save & test** (é possível que apresente um erro no teste, mas a fonte de dados já foi adicionada e pode ser consumida sem problemas)

17. Crie o dashboard de monitoramento no Grafana
   - Acesse **Dashboards -> New -> Import -> Upload dashboard JSON file** e selecione o arquivo presente em ./grafana_config/dashboard.json
   - Selecione o Data Source do Prometheus e do Loki
   - Clique em **Import** (Por hora não haverá dados pois não fizemos o deploy da aplicação)
18. Crie os alertas no Grafana
   - Acesse **Alerting -> Alert rules -> New alert rule**
   - Uso de memória
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
   - Uso de CPU
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
   - Quantidade de répicas
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

19. Faça o Deploy da aplicação fazendo um push para a branch **main**