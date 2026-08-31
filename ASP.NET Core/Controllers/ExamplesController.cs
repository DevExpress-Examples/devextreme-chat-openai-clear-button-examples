using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ASP_NET_Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace ASP_NET_Core.Controllers
{
    public class ExamplesController : Controller
    {
        public IActionResult Drawer() => View(new ChatViewModel { CurrentUser = new ChatUser { Id = "user" } });
        public IActionResult FullPage() => View(new ChatViewModel { CurrentUser = new ChatUser { Id = "user" } });
        public IActionResult Popup() => View(new ChatViewModel { CurrentUser = new ChatUser { Id = "user" } });

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error() {
            return View();
        }
    }
}
