CREATE TABLE plans (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	commission_rate FLOAT, 
	monthly_fee FLOAT, 
	modules JSON, 
	is_default BOOLEAN, 
	PRIMARY KEY (id)
);

CREATE TABLE product_types (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE web_templates (
	id UUID NOT NULL, 
	name VARCHAR, 
	description VARCHAR, 
	preview_url VARCHAR, 
	schema_data JSON, 
	active_plans JSON, 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE product_attributes (
	id UUID NOT NULL, 
	product_type_id UUID, 
	name VARCHAR, 
	attribute_type VARCHAR, 
	options JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_type_id) REFERENCES product_types (id)
);

CREATE TABLE users (
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
	is_global_staff BOOLEAN, 
	shop_slug VARCHAR, 
	category VARCHAR, 
	hours VARCHAR, 
	custom_domain VARCHAR, 
	onboarding_completed BOOLEAN, 
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
	plan_id UUID, 
	PRIMARY KEY (id), 
	UNIQUE (custom_domain), 
	FOREIGN KEY(referred_by_id) REFERENCES users (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	FOREIGN KEY(plan_id) REFERENCES plans (id)
);

CREATE TABLE activity_logs (
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

CREATE TABLE ai_assistants (
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

CREATE TABLE channel_connections (
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

CREATE TABLE collections (
	id UUID NOT NULL, 
	title VARCHAR, 
	description VARCHAR, 
	image_url VARCHAR, 
	status VARCHAR, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE custom_roles (
	id UUID NOT NULL, 
	name VARCHAR, 
	permissions JSON, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE expenses (
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

CREATE TABLE incomes (
	id UUID NOT NULL, 
	description VARCHAR, 
	amount FLOAT, 
	category VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE notifications (
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

CREATE TABLE orders (
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

CREATE TABLE pages (
	id UUID NOT NULL, 
	slug VARCHAR, 
	title VARCHAR, 
	content JSON, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE providers (
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

CREATE TABLE purchase_orders (
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

CREATE TABLE receivables (
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

CREATE TABLE sellers (
	id UUID NOT NULL, 
	name VARCHAR, 
	role VARCHAR, 
	branch VARCHAR, 
	tenant_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE shipping_options (
	id UUID NOT NULL, 
	name VARCHAR, 
	cost FLOAT, 
	min_order_total FLOAT, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE shop_pages (
	id UUID NOT NULL, 
	tenant_id UUID, 
	page_key VARCHAR, 
	schema_data JSON, 
	is_published BOOLEAN, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tenant_id) REFERENCES users (id)
);

CREATE TABLE store_messages (
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

CREATE TABLE tax_rates (
	id UUID NOT NULL, 
	name VARCHAR, 
	rate FLOAT, 
	is_default BOOLEAN, 
	owner_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE ai_assistant_logs (
	id UUID NOT NULL, 
	assistant_id UUID, 
	action_type VARCHAR, 
	detail VARCHAR, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assistant_id) REFERENCES ai_assistants (id)
);

CREATE TABLE payroll_employees (
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

CREATE TABLE products (
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
	owner_id UUID, 
	product_type_id UUID, 
	collection_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	FOREIGN KEY(product_type_id) REFERENCES product_types (id), 
	FOREIGN KEY(collection_id) REFERENCES collections (id)
);

CREATE TABLE shipments (
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

CREATE TABLE product_variants (
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

CREATE TABLE order_items (
	id UUID NOT NULL, 
	order_id UUID, 
	product_variant_id UUID, 
	quantity INTEGER, 
	price_at_purchase FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id), 
	FOREIGN KEY(product_variant_id) REFERENCES product_variants (id)
);