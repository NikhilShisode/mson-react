import _ from 'lodash';
import Roles from './roles';

// e.g.
// access: {
//   form: {
//     create: '2',
//     read: [ '1', '2' ],
//     update: [ '1', '2' ],
//     archive: '2'
//   },
//
//   fields: {
//     firstName: {
//       create: '2',
//       read: [ '1', '2' ],
//       update: '2',
//       archive: '2'
//     }
//   }
// }
export default class AccessControl {
  // Note: the roles are indexed as this should provide a faster lookup to using indexOf()
  _hasAccess(access, indexedRoles, isOwner) {
    if (!Array.isArray(access)) {
      access = [access];
    }

    let has = false;

    _.each(access, role => {
      if (
        indexedRoles[role] ||
        (isOwner && (role === Roles.ID_OWNER || role === Roles.OWNER))
      ) {
        has = true;
        return false;
      }
    });

    return has;
  }

  hasFormAccess(operation, access, indexedRoles, isOwner) {
    const formAccess = _.get(access, ['form', operation]);
    if (formAccess !== undefined) {
      return this._hasAccess(formAccess, indexedRoles, isOwner);
    } else {
      // No access has been specified so we assume anyone can access it
      return true;
    }
  }

  _canAccessField(operation, access, indexedRoles, fieldName, isOwner) {
    // Priority given to field layer access if it exists
    const fieldAccess = _.get(access, ['fields', fieldName, operation]);
    if (fieldAccess !== undefined) {
      return this._hasAccess(fieldAccess, indexedRoles, isOwner);
    }

    // We now look for access at the form layer
    return this.hasFormAccess(operation, access, indexedRoles, isOwner);
  }

  canAccess(operation, access, indexedRoles, fieldValues, isOwner) {
    const errors = [];
    _.each(fieldValues, (value, name) => {
      if (
        !this._canAccessField(operation, access, indexedRoles, name, isOwner)
      ) {
        errors.push(name);
      }
    });
    return errors;
  }

  fieldsCanAccess(operation, access, indexedRoles, fieldValues, isOwner) {
    // Clone so that we don't modify original data
    fieldValues = _.clone(fieldValues);
    _.each(fieldValues, (value, name) => {
      if (
        !this._canAccessField(operation, access, indexedRoles, name, isOwner)
      ) {
        delete fieldValues[name];
      }
    });
    return fieldValues;
  }

  canCreate(access, indexedRoles, fieldValues, isOwner) {
    return this.canAccess('create', access, indexedRoles, fieldValues, isOwner);
  }

  canRead(access, indexedRoles, fieldValues, isOwner) {
    return this.canAccess('read', access, indexedRoles, fieldValues, isOwner);
  }

  canUpdate(access, indexedRoles, fieldValues, isOwner) {
    return this.canAccess('update', access, indexedRoles, fieldValues, isOwner);
  }

  canArchive(access, indexedRoles, fieldValues, isOwner) {
    return this.canAccess(
      'archive',
      access,
      indexedRoles,
      fieldValues,
      isOwner
    );
  }
}