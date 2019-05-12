﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using magic.signals.contracts;
using System.Linq;

namespace magic.signals.services
{
    public class Signaler : ISignaler
    {
        readonly Dictionary<string, List<Type>> _slots;
        readonly IServiceProvider _kernel;

        public Signaler(IEnumerable<Type> types, IServiceProvider kernel)
        {
            _kernel = kernel;
            _slots = new Dictionary<string, List<Type>>();
            foreach (var idxType in types)
            {
                var name = idxType.GetCustomAttributes(true).OfType<SlotAttribute>().FirstOrDefault()?.Name;

                if (string.IsNullOrEmpty(name))
                    throw new ArgumentNullException($"No name specified for type '{idxType}'");

                if (!_slots.TryGetValue(name, out var slot))
                {
                    slot = new List<Type>();
                    _slots[name] = slot;
                }

                slot.Add(idxType);
            }
        }

        #region [ -- Interface implementations -- ]

        public void Signal(string name, JObject input)
        {
            if (!_slots.ContainsKey(name))
                return;

            foreach (var idxType in _slots[name])
            {
                var instance = _kernel.GetService(idxType) as ISlot;
                instance.Signal(input);
            }
        }

        #endregion
    }
}
