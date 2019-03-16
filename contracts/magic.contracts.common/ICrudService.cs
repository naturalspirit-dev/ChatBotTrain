﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;

namespace magic.contracts.common
{
    public interface ICrudService<DbModel>
    {
        Guid Create(DbModel model);
        DbModel Get(Guid id);
        IEnumerable<DbModel> List(int offset, int limit);
        void Update(DbModel model);
        void Delete(Guid id);
        long Count();
    }
}
