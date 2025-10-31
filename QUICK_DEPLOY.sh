#!/bin/bash

# Quick Deploy to VPS
# Just run this script and follow the prompts!

clear
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║        Delirium VPS Deployment                          ║"
echo "║        Deploy to: 203.0.113.10 (example.com)          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ DNS Check: example.com → 203.0.113.10"
echo ""
echo "Choose deployment method:"
echo ""
echo "  1) Automated deployment from local machine"
echo "     (Tests everything, then deploys automatically)"
echo ""
echo "  2) Show manual commands to run on VPS"
echo "     (Copy/paste commands into your SSH session)"
echo ""
echo "  3) Direct SSH deployment"
echo "     (SSH into VPS and run deployment script)"
echo ""
read -p "Select option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Running automated deployment..."
        ./scripts/setup-vps-from-local.sh
        ;;
    2)
        echo ""
        echo "╔══════════════════════════════════════════════════════════╗"
        echo "║  Manual Deployment Instructions                         ║"
        echo "╚══════════════════════════════════════════════════════════╝"
        echo ""
        echo "1. SSH into your VPS:"
        echo "   ssh deploy@203.0.113.10"
        echo ""
        echo "2. Download and run deployment script:"
        read -p "Enter your email for SSL certificates: " email
        echo ""
        echo "   curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh -o deploy.sh"
        echo "   chmod +x deploy.sh"
        echo "   ./deploy.sh example.com $email"
        echo ""
        echo "3. Wait for deployment to complete (5-10 minutes)"
        echo ""
        echo "4. Visit: https://example.com"
        echo ""
        ;;
    3)
        read -p "Enter your email for SSL certificates: " email
        echo ""
        echo "Connecting to VPS and running deployment..."
        ssh deploy@203.0.113.10 "curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh | bash -s example.com $email"
        ;;
    *)
        echo ""
        echo "Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Deployment Complete!                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Your site should be live at: https://example.com"
echo ""
echo "Useful commands:"
echo "  View logs:    ssh deploy@203.0.113.10 'cd ~/delirium && docker compose -f docker-compose.prod.yml logs -f'"
echo "  Check status: ssh deploy@203.0.113.10 'cd ~/delirium && docker compose -f docker-compose.prod.yml ps'"
echo ""

