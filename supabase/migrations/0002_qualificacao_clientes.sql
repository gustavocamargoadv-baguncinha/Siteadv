-- Qualificação completa do cliente, usada na geração automática de
-- procuração, declaração de hipossuficiência e contrato de honorários.

alter table clientes add column if not exists rg text;
alter table clientes add column if not exists nacionalidade text;
alter table clientes add column if not exists estado_civil text;
alter table clientes add column if not exists profissao text;
