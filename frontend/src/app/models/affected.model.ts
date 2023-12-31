
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * Generic model for endpoints returning affected number of records.
 * 
 * Typically the response returned from DELETE and PUT
 * invocations to automatically generated CRUD endpoints.
 */
export class Affected {

  /**
   * Affected records as returned from server.
   */
  affected: number;
}
