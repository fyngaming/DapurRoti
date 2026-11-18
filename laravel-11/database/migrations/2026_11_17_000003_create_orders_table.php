<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone', 25);
            $table->text('delivery_address');
            $table->dateTime('event_datetime');
            $table->enum('order_type', ['po', 'direct'])->default('po');
            $table->enum('payment_method', ['cash', 'transfer'])->default('transfer');
            $table->integer('total_amount');
            $table->integer('dp_amount')->default(0);
            $table->enum('status', ['pending_wa', 'confirmed', 'completed', 'cancelled'])
                ->default('pending_wa');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
