﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.SqlClient;
using magic.node;
using magic.lambda.utilities;

namespace magic.lambda.mssql.utilities
{
	public static class Executor
    {
        public static void Execute(
            Node input,
            Stack<SqlConnection> connections,
            Action<SqlCommand> functor)
        {
            using (var cmd = new SqlCommand(input.Get<string>(), connections.Peek()))
            {
                input.Value = null;
                foreach (var idxPar in input.Children)
                {
                    cmd.Parameters.AddWithValue(idxPar.Name, idxPar.Value);
                }
                functor(cmd);
            }
            input.Value = null;
        }
    }
}
