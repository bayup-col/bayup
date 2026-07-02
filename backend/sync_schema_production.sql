-- Sincroniza la base de datos de PRODUCCIÓN (Supabase/Postgres) con lo que
-- el código (backend/models.py) espera hoy. Generado automáticamente desde
-- los modelos reales — solo agrega tablas/columnas que falten, nunca borra
-- ni modifica nada existente (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF
-- NOT EXISTS). Seguro de correr aunque parte de esto ya exista.
--
-- Cómo usarlo: Supabase → tu proyecto → SQL Editor → pega todo este
-- archivo → Run. Después de correrlo, probá de nuevo el registro en
-- producción.

CREATE TABLE IF NOT EXISTS plans (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	commission_rate FLOAT, 
	monthly_fee FLOAT, 
	modules JSON, 
	is_default BOOLEAN, 
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS product_types (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS web_templates (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	category VARCHAR, 
	tags JSON, 
	uses INTEGER, 
	rating FLOAT, 
	is_premium BOOLEAN, 
	color VARCHAR, 
	preview_url VARCHAR, 
	schema_data JSON, 
	active_plans JSON, 
	is_active BOOLEAN, 
	template_type VARCHAR(10) NOT NULL, 
	html_pages JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS product_attributes (
	id UUID NOT NULL, 
	product_type_id UUID, 
	name VARCHAR, 
	attribute_type VARCHAR, 
	options JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_type_id) REFERENCES product_types (id)
);

CREATE TABLE IF NOT EXISTS users (
	id UUID NOT NULL, 
	email VARCHAR, 
	full_name VARCHAR, 
	logo_url VARCHAR, 
	nit VARCHAR, 
	address VARCHAR, 
	customer_city VARCHAR, 
	nickname VARCHAR, 
	phone VARCHAR, 
	hashed_password VARCHAR, 
	role VARCHAR, 
	status VARCHAR, 
	reviewer_notes VARCHAR, 
	is_global_staff BOOLEAN, 
	email_confirmed BOOLEAN, 
	shop_slug VARCHAR, 
	category VARCHAR, 
	hours VARCHAR, 
	custom_domain VARCHAR, 
	onboarding_completed BOOLEAN, 
	story VARCHAR, 
	country VARCHAR, 
	website VARCHAR, 
	tax_regime VARCHAR, 
	legal_rep VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	bank_accounts JSON, 
	social_links JSON, 
	whatsapp_lines JSON, 
	permissions JSON, 
	custom_commission_rate FLOAT, 
	commission_is_fixed BOOLEAN, 
	commission_fixed_until TIMESTAMP WITHOUT TIME ZONE, 
	last_month_revenue FLOAT, 
	referred_by_id UUID, 
	owner_id UUID, 
	loyalty_points INTEGER, 
	total_spent FLOAT, 
	last_purchase_date TIMESTAMP WITHOUT TIME ZONE, 
	last_purchase_summary VARCHAR, 
	customer_type VARCHAR, 
	acquisition_channel VARCHAR, 
	password_reset_token VARCHAR, 
	password_reset_expires TIMESTAMP WITHOUT TIME ZONE, 
	email_confirmation_token VARCHAR(255), 
	email_confirmation_expires TIMESTAMP WITHOUT TIME ZONE, 
	plan_id UUID, 
	PRIMARY KEY (id), 
	UNIQUE (custom_domain), 
	FOREIGN KEY(referred_by_id) REFERENCES users (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	FOREIGN KEY(plan_id) REFERENCES plans (id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
	id UUID NOT NULL, 
	user_id UUID, 
	action VARCHAR, 
	target_id VARCHAR, 
	detail VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS ai_assistants (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	assistant_type VARCHAR, 
	status VARCHAR, 
	n8n_webhook_url VARCHAR, 
	system_prompt VARCHAR, 
	config JSON, 
	owner_id UUID, 
	total_actions INTEGER, 
	success_rate FLOAT, 
	last_run TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS channel_connections (
	id UUID NOT NULL, 
	user_id UUID, 
	channel_type VARCHAR, 
	status VARCHAR, 
	account_id VARCHAR, 
	access_token VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS collections (
	id UUID NOT NULL, 
	title VARCHAR, 
	description VARCHAR, 
	image_url VARCHAR, 
	status VARCHAR, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS custom_roles (
	id UUID NOT NULL, 
	name VARCHAR, 
	permissions JSON, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS expenses (
	id UUID NOT NULL, 
	description VARCHAR, 
	amount FLOAT, 
	due_date TIMESTAMP WITHOUT TIME ZONE, 
	status VARCHAR, 
	category VARCHAR, 
	tenant_id UUID, 
	invoice_num VARCHAR, 
	items JSON, 
	description_detail VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS incomes (
	id UUID NOT NULL, 
	description VARCHAR, 
	amount FLOAT, 
	category VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
	id UUID NOT NULL, 
	tenant_id UUID, 
	title VARCHAR, 
	message VARCHAR, 
	type VARCHAR, 
	is_read BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS orders (
	id UUID NOT NULL, 
	customer_id UUID, 
	tenant_id UUID, 
	total_price FLOAT, 
	commission_amount FLOAT, 
	commission_rate_snapshot FLOAT, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	tax_rate_id UUID, 
	tax_rate_snapshot FLOAT, 
	shipping_option_id UUID, 
	shipping_cost_snapshot FLOAT, 
	customer_name VARCHAR, 
	customer_email VARCHAR, 
	customer_phone VARCHAR, 
	customer_city VARCHAR, 
	shipping_address VARCHAR, 
	customer_type VARCHAR, 
	source VARCHAR, 
	payment_method VARCHAR, 
	seller_name VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(customer_id) REFERENCES users (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS pages (
	id UUID NOT NULL, 
	slug VARCHAR, 
	title VARCHAR, 
	content JSON, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS payments (
	id UUID NOT NULL, 
	tenant_id UUID NOT NULL, 
	amount FLOAT NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	customer_name VARCHAR(255), 
	customer_email VARCHAR(255), 
	customer_phone VARCHAR(50), 
	items JSON, 
	gateway VARCHAR(50), 
	gateway_payment_id VARCHAR(255), 
	gateway_redirect_url VARCHAR(1024), 
	gateway_response JSON, 
	whatsapp_url VARCHAR(1024), 
	idempotency_key VARCHAR(128), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS providers (
	id UUID NOT NULL, 
	name VARCHAR, 
	contact_name VARCHAR, 
	email VARCHAR, 
	phone VARCHAR, 
	category VARCHAR, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
	id UUID NOT NULL, 
	product_name VARCHAR, 
	quantity INTEGER, 
	items JSON, 
	total_amount FLOAT, 
	provider_name VARCHAR, 
	status VARCHAR, 
	sending_method VARCHAR, 
	scheduled_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS receivables (
	id UUID NOT NULL, 
	client_name VARCHAR, 
	amount FLOAT, 
	due_date TIMESTAMP WITHOUT TIME ZONE, 
	status VARCHAR, 
	tenant_id UUID, 
	invoice_num VARCHAR, 
	items JSON, 
	description_detail VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS sellers (
	id UUID NOT NULL, 
	name VARCHAR, 
	role VARCHAR, 
	branch VARCHAR, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS shipping_options (
	id UUID NOT NULL, 
	name VARCHAR, 
	cost FLOAT, 
	min_order_total FLOAT, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS shop_pages (
	id UUID NOT NULL, 
	tenant_id UUID, 
	page_key VARCHAR, 
	schema_data JSON, 
	template_id VARCHAR, 
	is_published BOOLEAN, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS store_messages (
	id UUID NOT NULL, 
	tenant_id UUID, 
	customer_name VARCHAR, 
	customer_email VARCHAR, 
	customer_phone VARCHAR, 
	message VARCHAR, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
	id UUID NOT NULL, 
	tenant_id UUID, 
	title VARCHAR, 
	category VARCHAR, 
	priority VARCHAR, 
	status VARCHAR, 
	messages JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS tax_rates (
	id UUID NOT NULL, 
	name VARCHAR, 
	rate FLOAT, 
	is_default BOOLEAN, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS ai_assistant_logs (
	id UUID NOT NULL, 
	assistant_id UUID, 
	action_type VARCHAR, 
	detail VARCHAR, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assistant_id) REFERENCES ai_assistants (id)
);

CREATE TABLE IF NOT EXISTS payroll_employees (
	id UUID NOT NULL, 
	name VARCHAR, 
	role VARCHAR, 
	base_salary FLOAT, 
	tenant_id UUID, 
	user_id UUID, 
	seller_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(seller_id) REFERENCES sellers (id)
);

CREATE TABLE IF NOT EXISTS products (
	id UUID NOT NULL,
	name VARCHAR,
	description VARCHAR,
	price FLOAT,
	wholesale_price FLOAT,
	cost FLOAT,
	category VARCHAR,
	sku VARCHAR,
	status VARCHAR,
	add_gateway_fee BOOLEAN,
	image_url JSON,
	tags JSON,
	warranty VARCHAR,
	features JSON,
	important_info VARCHAR,
	owner_id UUID,
	product_type_id UUID,
	collection_id UUID,
	PRIMARY KEY (id),
	FOREIGN KEY(owner_id) REFERENCES users (id),
	FOREIGN KEY(product_type_id) REFERENCES product_types (id),
	FOREIGN KEY(collection_id) REFERENCES collections (id)
);

CREATE TABLE IF NOT EXISTS shipments (
	id UUID NOT NULL, 
	order_id UUID, 
	tenant_id UUID, 
	status VARCHAR, 
	recipient_name VARCHAR, 
	recipient_phone VARCHAR, 
	destination_address VARCHAR, 
	carrier VARCHAR, 
	tracking_number VARCHAR, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS product_variants (
	id UUID NOT NULL, 
	product_id UUID, 
	name VARCHAR, 
	sku VARCHAR, 
	price FLOAT, 
	stock INTEGER, 
	image_url VARCHAR, 
	attributes JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS order_items (
	id UUID NOT NULL, 
	order_id UUID, 
	product_variant_id UUID, 
	quantity INTEGER, 
	price_at_purchase FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id), 
	FOREIGN KEY(product_variant_id) REFERENCES product_variants (id)
);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS commission_rate FLOAT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS monthly_fee FLOAT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS modules JSON;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_default BOOLEAN;
ALTER TABLE product_types ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE product_types ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE product_types ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS tags JSON;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS uses INTEGER;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS rating FLOAT;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS is_premium BOOLEAN;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS color VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS preview_url VARCHAR;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS schema_data JSON;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS active_plans JSON;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS template_type VARCHAR(10);
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS html_pages JSON;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS product_type_id UUID;
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS attribute_type VARCHAR;
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS options JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nit VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_city VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_notes VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_global_staff BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_slug VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hours VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS story VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_regime VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_rep VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_accounts JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_lines JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_commission_rate FLOAT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_is_fixed BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_fixed_until TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_month_revenue FLOAT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent FLOAT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_summary VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_type VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_channel VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_expires TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS action VARCHAR;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_id VARCHAR;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS detail VARCHAR;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS assistant_type VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS n8n_webhook_url VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS system_prompt VARCHAR;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS config JSON;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS total_actions INTEGER;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS success_rate FLOAT;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS last_run TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS channel_type VARCHAR;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS account_id VARCHAR;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS access_token VARCHAR;
ALTER TABLE channel_connections ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS image_url VARCHAR;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS permissions JSON;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount FLOAT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_num VARCHAR;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS items JSON;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description_detail VARCHAR;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS amount FLOAT;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message VARCHAR;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate_snapshot FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate_snapshot FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_snapshot FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_city VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_name VARCHAR;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS slug VARCHAR;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content JSON;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount FLOAT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS items JSON;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_redirect_url VARCHAR(1024);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSON;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS whatsapp_url VARCHAR(1024);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS contact_name VARCHAR;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS product_name VARCHAR;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS items JSON;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_amount FLOAT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS provider_name VARCHAR;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sending_method VARCHAR;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS client_name VARCHAR;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS amount FLOAT;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS invoice_num VARCHAR;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS items JSON;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS description_detail VARCHAR;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS role VARCHAR;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS branch VARCHAR;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE shipping_options ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE shipping_options ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE shipping_options ADD COLUMN IF NOT EXISTS cost FLOAT;
ALTER TABLE shipping_options ADD COLUMN IF NOT EXISTS min_order_total FLOAT;
ALTER TABLE shipping_options ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS page_key VARCHAR;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS schema_data JSON;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS template_id VARCHAR;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS is_published BOOLEAN;
ALTER TABLE shop_pages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS customer_name VARCHAR;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS customer_email VARCHAR;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS customer_phone VARCHAR;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS message VARCHAR;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority VARCHAR;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS messages JSON;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS rate FLOAT;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS is_default BOOLEAN;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS assistant_id UUID;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS action_type VARCHAR;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS detail VARCHAR;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE ai_assistant_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS role VARCHAR;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS base_salary FLOAT;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS add_gateway_fee BOOLEAN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url JSON;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSON;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSON;
ALTER TABLE products ADD COLUMN IF NOT EXISTS important_info VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_name VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_address VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS carrier VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_number VARCHAR;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku VARCHAR;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price FLOAT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url VARCHAR;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS attributes JSON;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_variant_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price_at_purchase FLOAT;
