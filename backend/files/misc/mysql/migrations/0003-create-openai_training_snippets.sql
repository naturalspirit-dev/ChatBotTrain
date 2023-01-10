
create table ml_types(
  "type" varchar(256) not null,
  "model" varchar(1024) not null,
  "max_tokens" int not null,
  "temperature" decimal(3,2) not null,
  primary key (type)
);

insert into ml_types(type, model, max_tokens, temperature) values ('hl', 'curie', 2000, 0.1);

create table ml_training_snippets(
  id int(11) not null auto_increment,
  created timestamp not null default current_timestamp,
  type varchar(256) not null default 'hl',
  pushed smallint not null default 0,
  uri varchar(1024) null,
  prompt text not null,
  completion text not null,
  primary key (id),
  constraint ml_training_snippets_type_fky foreign key (type) references ml_types (type) on delete cascade
);