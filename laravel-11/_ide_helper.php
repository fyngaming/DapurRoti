<?php
/**
 * IDE Helper Stubs for Laravel 11
 * File ini menyediakan definisi tipe lengkap untuk VS Code & PHP Intelephense
 * agar tidak muncul error di Model, Controller, Migration, dan Seeder.
 * @noinspection ALL
 */

namespace Symfony\Component\HttpFoundation {
    class Response {}
}

namespace Laravel\Socialite\Facades {
    class Socialite {
        public static function driver(string $driver = 'google'): static { return new static(); }
        public function redirect(): \Illuminate\Http\RedirectResponse { return new \Illuminate\Http\RedirectResponse(''); }
        public function user(): object {
            return new class {
                public function getId(): string { return ''; }
                public function getName(): string { return ''; }
                public function getEmail(): string { return ''; }
                public function getAvatar(): ?string { return null; }
            };
        }
    }
}

namespace Illuminate\Database {
    abstract class Seeder {
        public function run(): void {}
    }
}

namespace Illuminate\Database\Eloquent\Relations {
    class Relation {
        public function exists(): bool { return true; }
        public function getResults(): mixed { return null; }
    }

    class BelongsTo extends Relation {
        public function getResults(): mixed { return null; }
    }

    class HasMany extends Relation {
        public function getResults(): mixed { return new \Illuminate\Database\Eloquent\Collection(); }
    }

    class BelongsToMany extends Relation {
        public function getResults(): mixed { return new \Illuminate\Database\Eloquent\Collection(); }
    }

    class HasOne extends Relation {
        public function getResults(): mixed { return null; }
    }
}

namespace Illuminate\Database\Eloquent {
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\BelongsToMany;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Relations\HasOne;

    abstract class Model implements \ArrayAccess, \JsonSerializable {
        public function belongsTo($related, $foreignKey = null, $ownerKey = null, $relation = null): BelongsTo {
            return new BelongsTo();
        }

        public function hasMany($related, $foreignKey = null, $localKey = null): HasMany {
            return new HasMany();
        }

        public function belongsToMany($related, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null): BelongsToMany {
            return new BelongsToMany();
        }

        public function hasOne($related, $foreignKey = null, $localKey = null): HasOne {
            return new HasOne();
        }

        public static function find($id, $columns = ['*']): static|null {
            return null;
        }

        public static function findOrFail($id, $columns = ['*']): static {
            return new static();
        }

        public static function create(array $attributes = []): static {
            return new static();
        }

        public static function where($column, $operator = null, $value = null, $boolean = 'and'): static {
            return new static();
        }

        public function orWhere($column, $operator = null, $value = null): static {
            return $this;
        }

        public static function whereIn($column, $values, $boolean = 'and', $not = false): static {
            return new static();
        }

        public static function latest($column = null): static {
            return new static();
        }

        public static function orderBy(string $column, string $direction = 'asc'): static {
            return new static();
        }

        public static function withCount($relations): static {
            return new static();
        }

        public function first($columns = ['*']): static|null {
            return null;
        }

        public function get($columns = ['*']): Collection {
            return new Collection();
        }

        public static function all($columns = ['*']): Collection {
            return new Collection();
        }

        public function exists(): bool {
            return true;
        }

        public function save(array $options = []): bool {
            return true;
        }

        public function delete(): ?bool {
            return true;
        }

        public function update(array $attributes = [], array $options = []): bool {
            return true;
        }

        public static function with($relations): static {
            return new static();
        }

        public function offsetExists(mixed $offset): bool {
            return false;
        }

        public function offsetGet(mixed $offset): mixed {
            return null;
        }

        public function offsetSet(mixed $offset, mixed $value): void {}

        public function offsetUnset(mixed $offset): void {}

        public function jsonSerialize(): mixed {
            return [];
        }
    }

    class Collection implements \IteratorAggregate, \Countable, \ArrayAccess {
        public function getIterator(): \Traversable {
            return new \ArrayIterator([]);
        }

        public function count(): int {
            return 0;
        }

        public function offsetExists(mixed $offset): bool {
            return false;
        }

        public function offsetGet(mixed $offset): mixed {
            return null;
        }

        public function offsetSet(mixed $offset, mixed $value): void {}

        public function offsetUnset(mixed $offset): void {}

        public function keyBy($keyBy): static {
            return $this;
        }

        public function pluck($value, $key = null): static {
            return $this;
        }

        public function all(): array {
            return [];
        }
    }
}

namespace Illuminate\Database\Eloquent\Factories {
    trait HasFactory {}
}

namespace Illuminate\Foundation\Auth {
    /**
     * @property bool $is_admin
     */
    class User extends \Illuminate\Database\Eloquent\Model {}
}

namespace Illuminate\Notifications {
    trait Notifiable {}
}

namespace Illuminate\Support {
    class Carbon extends \DateTime {
        public function translatedFormat(string $format): string {
            return '';
        }

        public function format(string $format): string {
            return '';
        }
    }

    class Str {
        public static function upper(string $value): string {
            return '';
        }

        public static function slug(string $title, string $separator = '-'): string {
            return '';
        }

        public static function random(int $length = 16): string {
            return '';
        }
    }
}

namespace Illuminate\Support\Facades {
    class DB {
        public static function transaction(\Closure $callback, int $attempts = 1): mixed {
            return $callback();
        }
    }

    class Route {
        public static function get(string $uri, mixed $action = null): static { return new static(); }
        public static function post(string $uri, mixed $action = null): static { return new static(); }
        public static function patch(string $uri, mixed $action = null): static { return new static(); }
        public static function delete(string $uri, mixed $action = null): static { return new static(); }
        public static function prefix(string $prefix): static { return new static(); }
        public static function middleware(mixed $middleware): static { return new static(); }
        public static function name(string $name): static { return new static(); }
        public static function group(\Closure $callback): void {}
    }

    class Auth {
        public static function user(): ?\App\Models\User { return null; }
        public static function check(): bool { return false; }
        public static function id(): ?int { return null; }
        public static function login(mixed $user, bool $remember = false): void {}
    }

    class Schema {
        public static function create(string $table, \Closure $callback): void {}
        public static function dropIfExists(string $table): void {}
        public static function table(string $table, \Closure $callback): void {}
    }
}

namespace Illuminate\Http {
    class Request {
        public function user(): ?\App\Models\User { return null; }
        public function validate(array $rules, ...$params): array { return []; }
        public function all(): array { return []; }
        public function input(?string $key = null, mixed $default = null): mixed { return $default; }
    }

    class JsonResponse {}
    class Response extends \Symfony\Component\HttpFoundation\Response {}

    class RedirectResponse extends Response {
        public function with(string $key, mixed $value = true): static { return $this; }
        public function withErrors(mixed $errors): static { return $this; }
        public function route(string $route, array $parameters = []): static { return $this; }
        public function intended(string $default = '/'): static { return $this; }
    }
}

namespace Illuminate\View {
    class View {}
}

namespace Illuminate\Database\Migrations {
    abstract class Migration {
        public function up(): void {}
        public function down(): void {}
    }
}

namespace Illuminate\Database\Schema {
    class ColumnDefinition {
        public function nullable(bool $value = true): static { return $this; }
        public function default(mixed $value): static { return $this; }
        public function unique(): static { return $this; }
        public function after(string $column): static { return $this; }
        public function change(): static { return $this; }
        public function constrained(?string $table = null, string $column = 'id'): static { return $this; }
        public function cascadeOnDelete(): static { return $this; }
        public function nullOnDelete(): static { return $this; }
        public function restrictOnDelete(): static { return $this; }
    }

    class Blueprint {
        public function id(string $column = 'id'): ColumnDefinition { return new ColumnDefinition(); }
        public function string(string $column, ?int $length = null): ColumnDefinition { return new ColumnDefinition(); }
        public function text(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function integer(string $column, bool $autoIncrement = false, bool $unsigned = false): ColumnDefinition { return new ColumnDefinition(); }
        public function unsignedBigInteger(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function boolean(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function dateTime(string $column, int $precision = 0): ColumnDefinition { return new ColumnDefinition(); }
        public function timestamp(string $column, int $precision = 0): ColumnDefinition { return new ColumnDefinition(); }
        public function timestamps(int $precision = 0): void {}
        public function foreignId(string $column): ColumnDefinition { return new ColumnDefinition(); }
        public function enum(string $column, array $allowed = []): ColumnDefinition { return new ColumnDefinition(); }
        public function rememberToken(): ColumnDefinition { return new ColumnDefinition(); }
        public function dropColumn(array|string $columns): void {}
        public function dropConstrainedForeignId(string $column): void {}
        public function dropForeign(array|string $index): void {}
    }
}

namespace App\Http\Controllers {
    abstract class Controller {}
}

namespace {
    if (!function_exists('config')) {
        function config(mixed $key = null, mixed $default = null): mixed { return $default; }
    }
    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed { return $default; }
    }
    if (!function_exists('collect')) {
        function collect(mixed $value = null): \Illuminate\Database\Eloquent\Collection { return new \Illuminate\Database\Eloquent\Collection(); }
    }
    if (!function_exists('abort')) {
        function abort(int $code, string $message = '', array $headers = []): void {}
    }
    if (!function_exists('response')) {
        function response(mixed $content = '', int $status = 200, array $headers = []): \Illuminate\Http\Response { return new \Illuminate\Http\Response(); }
    }
    if (!function_exists('view')) {
        function view(?string $view = null, array $data = [], array $mergeData = []): \Illuminate\View\View { return new \Illuminate\View\View(); }
    }
    if (!function_exists('redirect')) {
        function redirect(?string $to = null, int $status = 302, array $headers = [], ?bool $secure = null): \Illuminate\Http\RedirectResponse { return new \Illuminate\Http\RedirectResponse(''); }
    }
    if (!function_exists('now')) {
        function now(mixed $tz = null): \Illuminate\Support\Carbon { return new \Illuminate\Support\Carbon(); }
    }
    if (!function_exists('auth')) {
        function auth(mixed $guard = null): \Illuminate\Support\Facades\Auth { return new \Illuminate\Support\Facades\Auth(); }
    }
    if (!function_exists('route')) {
        function route(string $name, array $parameters = [], bool $absolute = true): string { return ''; }
    }
    if (!function_exists('back')) {
        function back(int $status = 302, array $headers = [], bool $fallback = false): \Illuminate\Http\RedirectResponse { return new \Illuminate\Http\RedirectResponse(''); }
    }
}
