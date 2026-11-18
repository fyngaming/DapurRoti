<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 180);
            $table->string('slug', 180)->unique();
            $table->string('category', 120)->index();
            $table->text('description');
            $table->unsignedInteger('price')->default(0);
            $table->json('variants');
            $table->text('image');
            $table->unsignedInteger('stock')->default(20);
            $table->unsignedInteger('expired_days')->default(3);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->text('address');
            $table->string('phone', 40);
            $table->string('hours', 120)->default('06.00 – 19.00 WIB');
            $table->text('maps_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('title', 180);
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->unsignedInteger('discount_value')->default(0);
            $table->unsignedInteger('min_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->string('title', 220);
            $table->text('subtitle');
            $table->text('image');
            $table->string('cta_label', 80)->default('Lihat Menu');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('site_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('brand_name', 160);
            $table->string('tagline', 220)->default('');
            $table->string('footer_service_text', 220)->default('');
            $table->string('operating_hours', 160)->default('');
            $table->text('footer_address')->nullable();
            $table->string('footer_copyright', 220)->default('');
            $table->string('admin_whatsapp', 40)->default('');
            $table->string('bank_name', 60)->default('');
            $table->string('bank_account_number', 80)->default('');
            $table->string('bank_account_holder', 160)->default('');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('store_id')->nullable();
            $table->string('store_name', 160)->nullable();
            $table->string('customer_name', 160);
            $table->string('customer_email', 191);
            $table->string('customer_phone', 40);
            $table->text('delivery_address');
            $table->string('event_datetime', 64);
            $table->enum('order_type', ['po', 'direct'])->default('po');
            $table->enum('payment_method', ['cash', 'transfer'])->default('transfer');
            $table->string('promo_code', 60)->nullable();
            $table->unsignedInteger('discount_amount')->default(0);
            $table->unsignedInteger('total_amount')->default(0);
            $table->unsignedInteger('dp_amount')->default(0);
            $table->enum('status', ['pending_wa', 'confirmed', 'completed', 'cancelled'])->default('pending_wa');
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('product_id');
            $table->string('product_name', 180);
            $table->string('variant', 120)->default('Original');
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('subtotal')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('ads');
        Schema::dropIfExists('promos');
        Schema::dropIfExists('stores');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
