﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.utilities;

namespace magic.lambda.io
{
    [Slot(Name = "create-folder")]
    public class CreateFolder : ISlot
    {
        readonly ISignaler _signaler;

        public CreateFolder(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var path = RootResolver.Root + input.GetEx<string>(_signaler);
            if (Directory.Exists(path))
                input.Value = false;

            Directory.CreateDirectory(path);
            input.Value = true;
        }
    }
}
