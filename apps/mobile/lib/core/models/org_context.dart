/// Models shared across features. Kept intentionally permissive (dynamic
/// payloads from the API) while giving the UI typed accessors.
library;

class OrgContext {
  OrgContext({
    required this.userId,
    required this.companies,
    required this.activeCompanyId,
    required this.roleKeys,
    required this.permissions,
    required this.stores,
    required this.branches,
    this.profileEmail,
    this.profileName,
  });

  final String userId;
  /// Memberships: {company_id, role_key, status}
  final List<Map<String, dynamic>> companies;
  final String? activeCompanyId;
  final List<String> roleKeys;
  final List<String> permissions;
  final List<StoreRef> stores;
  final List<BranchRef> branches;
  final String? profileEmail;
  final String? profileName;

  bool can(String permission) => permissions.contains(permission);

  String? get primaryRoleKey =>
      roleKeys.isNotEmpty ? roleKeys.first : null;

  factory OrgContext.fromJson(Map<String, dynamic> json) {
    final memberships = (json['companies'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final roleKeys = memberships
        .map((m) => m['role_key'] as String?)
        .whereType<String>()
        .toList();
    final profile = json['profile'];
    return OrgContext(
      userId: (json['user'] is Map ? json['user']['id'] : null)?.toString() ?? '',
      companies: memberships,
      activeCompanyId: json['active_company']?.toString(),
      roleKeys: roleKeys,
      permissions: ((json['permissions'] as List<dynamic>?) ?? [])
          .map((e) => e.toString())
          .toList(),
      stores: ((json['stores'] as List<dynamic>?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map(StoreRef.fromJson)
          .toList(),
      branches: ((json['accessible_branches'] as List<dynamic>?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map(BranchRef.fromJson)
          .toList(),
      profileEmail: profile is Map ? profile['email']?.toString() : null,
      profileName: profile is Map
          ? (profile['full_name'] ?? profile['name'])?.toString()
          : null,
    );
  }
}

class StoreRef {
  StoreRef({required this.id, required this.companyId, required this.name});

  final String id;
  final String companyId;
  final String name;

  static StoreRef fromJson(Map<String, dynamic> json) => StoreRef(
        id: json['id'].toString(),
        companyId: json['company_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
      );
}

class BranchRef {
  BranchRef({
    required this.id,
    required this.companyId,
    required this.storeId,
    required this.name,
    this.code,
    this.status,
  });

  final String id;
  final String companyId;
  final String? storeId;
  final String name;
  final String? code;
  final String? status;

  static BranchRef fromJson(Map<String, dynamic> json) => BranchRef(
        id: json['id'].toString(),
        companyId: json['company_id']?.toString() ?? '',
        storeId: json['store_id']?.toString(),
        name: json['name']?.toString() ?? '',
        code: json['code']?.toString(),
        status: json['status']?.toString(),
      );

  bool get isActive => status == null || status == 'active';
}
