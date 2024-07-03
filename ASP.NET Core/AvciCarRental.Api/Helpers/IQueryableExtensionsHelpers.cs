using System.Linq.Expressions;

// Bu sınıf, IQueryable<T> için genişletme metodları içerir.
internal static class IQueryableExtensionsHelpers
{
    // Genişletme metodu OrderByDynamic, IQueryable<T> tipindeki bir sorguya, belirtilen üye (property) ve sıralama yönüne göre dinamik sıralama ekler.
    public static IQueryable<T> OrderByDynamic<T>(this IQueryable<T> query, string orderByMember, string direction)
    {
        // Expression API kullanarak, sorgunun üzerinde çalışacağı nesne türü için bir parametre oluşturur.
        var parameter = Expression.Parameter(typeof(T), "p");

        // orderByMember adlı üyeye (property) erişim sağlayan bir ifade oluşturur.
        var member = Expression.Property(parameter, orderByMember);

        // Üye (property) üzerinde çalışacak lambda ifadesini oluşturur.
        var lambda = Expression.Lambda(member, parameter);

        // Sıralama yönetimi, gelen direction parametresine göre "OrderBy" veya "OrderByDescending" metodunu seçer.
        string method = direction == "desc" ? "OrderByDescending" : "OrderBy";

        // Expression.Call metodu ile dinamik olarak LINQ metodunu (OrderBy veya OrderByDescending) çağırır.
        Type[] types = new Type[] { query.ElementType, lambda.Body.Type };
        var result = Expression.Call(typeof(Queryable), method, types, query.Expression, lambda);

        // Oluşturulan yeni sorgu ifadesini döndürür. Bu ifade, orijinal sorguya sıralama işlemi uygulanmış halidir.
        return query.Provider.CreateQuery<T>(result);
    }
}
